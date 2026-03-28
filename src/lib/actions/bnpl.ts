"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createTypedServerClient } from "@/lib/supabase/typed-client";
import type { BnplAccountSummary } from "@/lib/types/bnpl";

// ── Types ────────────────────────────────────────────────────────────────────

export type BnplActionResult<T = null> = {
  data: T | null;
  error: string | null;
};

export type BnplAccountRow = BnplAccountSummary & {
  store_id: string;
};

export type BnplInstallmentRow = {
  id: string;
  account_id: string;
  order_id: string | null;
  amount: number;
  due_date: string;
  status: "pending" | "paid" | "waived";
  created_at: string;
};

export type BnplPaymentRow = {
  id: string;
  installment_id: string;
  account_id: string;
  amount_paid: number;
  payment_method: string;
  note: string | null;
  created_at: string;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

async function requireManagerInStore(storeId: string) {
  const supabase = await createTypedServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase: null, user: null, error: "Authentication required." };

  const { data: membership } = await supabase
    .from("store_members")
    .select("role")
    .eq("store_id", storeId)
    .eq("user_id", user.id)
    .single();

  if (!membership || !["owner", "manager"].includes(membership.role)) {
    return { supabase: null, user: null, error: "Insufficient permissions." };
  }

  return { supabase, user, error: null };
}

// ── Account Actions ──────────────────────────────────────────────────────────

const createAccountSchema = z.object({
  storeId: z.uuid(),
  customerName: z.string().min(1, "Customer name is required"),
  phone: z.string().optional(),
  creditLimit: z.coerce.number().positive("Credit limit must be positive"),
  notes: z.string().optional(),
});

export async function createBnplAccountAction(
  _prevState: BnplActionResult<BnplAccountSummary>,
  formData: FormData,
): Promise<BnplActionResult<BnplAccountSummary>> {
  const raw = Object.fromEntries(formData);
  const parsed = createAccountSchema.safeParse(raw);

  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { storeId, customerName, phone, creditLimit, notes } = parsed.data;
  const { supabase, error: authError } = await requireManagerInStore(storeId);
  if (authError || !supabase) return { data: null, error: authError! };

  const { data, error } = await supabase
    .from("bnpl_accounts")
    .insert({
      store_id: storeId,
      customer_name: customerName,
      customer_phone: phone || null,
      credit_limit: creditLimit,
      balance_due: 0,
      status: "active",
      notes: notes || null,
    })
    .select(
      "id, customer_name, phone:customer_phone, credit_limit, balance_due, status, notes, created_at",
    )
    .single();

  if (error || !data) return { data: null, error: error?.message ?? "Failed to create account." };

  revalidatePath(`/dashboard/store/${storeId}/bnpl`);
  return { data: data as BnplAccountSummary, error: null };
}

const updateAccountStatusSchema = z.object({
  accountId: z.uuid(),
  storeId: z.uuid(),
  status: z.enum(["active", "frozen", "closed", "settled"]),
});

export async function updateBnplAccountStatusAction(
  accountId: string,
  storeId: string,
  status: "active" | "frozen" | "closed" | "settled",
): Promise<BnplActionResult> {
  const parsed = updateAccountStatusSchema.safeParse({ accountId, storeId, status });
  if (!parsed.success) return { data: null, error: "Invalid input." };

  const { supabase, error: authError } = await requireManagerInStore(storeId);
  if (authError || !supabase) return { data: null, error: authError! };

  const { error } = await supabase
    .from("bnpl_accounts")
    .update({ status })
    .eq("id", accountId)
    .eq("store_id", storeId);

  if (error) return { data: null, error: error.message };

  revalidatePath(`/dashboard/store/${storeId}/bnpl`);
  revalidatePath(`/dashboard/store/${storeId}/bnpl/${accountId}`);
  return { data: null, error: null };
}

// ── Installment Actions ──────────────────────────────────────────────────────

const createInstallmentSchema = z.object({
  accountId: z.uuid(),
  storeId: z.uuid(),
  amount: z.coerce.number().positive("Amount must be positive"),
  dueDate: z.string().min(1, "Due date is required"),
});

export async function createInstallmentAction(
  _prevState: BnplActionResult<{ id: string }>,
  formData: FormData,
): Promise<BnplActionResult<{ id: string }>> {
  const raw = Object.fromEntries(formData);
  const parsed = createInstallmentSchema.safeParse(raw);

  if (!parsed.success) return { data: null, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const { accountId, storeId, amount, dueDate } = parsed.data;
  const { supabase, error: authError } = await requireManagerInStore(storeId);
  if (authError || !supabase) return { data: null, error: authError! };

  const { data: account } = await supabase
    .from("bnpl_accounts")
    .select("status, credit_limit, balance_due")
    .eq("id", accountId)
    .eq("store_id", storeId)
    .single();

  if (!account) return { data: null, error: "Account not found." };
  if (account.status !== "active") return { data: null, error: "Account is not active." };
  if (Number(account.balance_due) + amount > Number(account.credit_limit)) {
    return { data: null, error: "Exceeds credit limit." };
  }

  const { data, error } = await supabase
    .from("bnpl_installments")
    .insert({ account_id: accountId, amount, due_date: dueDate, status: "pending" })
    .select("id")
    .single();

  if (error || !data) return { data: null, error: error?.message ?? "Failed to add installment." };

  // Update balance_due
  await supabase
    .from("bnpl_accounts")
    .update({ balance_due: Number(account.balance_due) + amount })
    .eq("id", accountId);

  revalidatePath(`/dashboard/store/${storeId}/bnpl/${accountId}`);
  revalidatePath(`/dashboard/store/${storeId}/bnpl`);
  return { data: { id: data.id }, error: null };
}

// ── Payment Actions ──────────────────────────────────────────────────────────

const recordPaymentSchema = z.object({
  installmentId: z.uuid(),
  accountId: z.uuid(),
  storeId: z.uuid(),
  amountPaid: z.coerce.number().positive("Amount must be positive"),
  paymentMethod: z.enum(["cash", "qr_transfer"]),
  qrChannelId: z.uuid().optional(),
  qrReference: z.string().trim().max(120).optional(),
  note: z.string().optional(),
});

const recordGeneralPaymentSchema = z.object({
  accountId: z.uuid(),
  storeId: z.uuid(),
  amountPaid: z.coerce.number().positive("Amount must be positive"),
  paymentMethod: z.enum(["cash", "qr_transfer"]),
  qrChannelId: z.uuid().optional(),
  qrReference: z.string().trim().max(120).optional(),
  note: z.string().optional(),
});

export async function recordBnplPaymentAction(
  _prevState: BnplActionResult,
  formData: FormData,
): Promise<BnplActionResult> {
  const raw = Object.fromEntries(formData);
  const parsed = recordPaymentSchema.safeParse(raw);

  if (!parsed.success) return { data: null, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const {
    installmentId,
    accountId,
    storeId,
    amountPaid,
    paymentMethod,
    qrChannelId,
    qrReference,
    note,
  } = parsed.data;
  const { supabase, user, error: authError } = await requireManagerInStore(storeId);
  if (authError || !supabase || !user) return { data: null, error: authError! };

  const noteParts: string[] = [];
  if (note?.trim()) noteParts.push(note.trim());
  if (paymentMethod === "qr_transfer") {
    if (qrChannelId) noteParts.push(`[QR_CHANNEL:${qrChannelId}]`);
    if (qrReference?.trim()) noteParts.push(`[QR_REF:${qrReference.trim()}]`);
  }
  const finalNote = noteParts.length > 0 ? noteParts.join(" ") : null;

  // The DB trigger handles balance_due update on bnpl_accounts
  const { error } = await supabase.from("bnpl_payments").insert({
    installment_id: installmentId,
    account_id: accountId,
    amount_paid: amountPaid,
    payment_method: paymentMethod,
    received_by: user.id,
    notes: finalNote,
  });

  if (error) return { data: null, error: error.message };

  revalidatePath(`/dashboard/store/${storeId}/bnpl/${accountId}`);
  revalidatePath(`/dashboard/store/${storeId}/bnpl`);
  return { data: null, error: null };
}

export async function recordGeneralBnplPaymentAction(
  _prevState: BnplActionResult<{ appliedAmount: number; paymentsCreated: number }>,
  formData: FormData,
): Promise<BnplActionResult<{ appliedAmount: number; paymentsCreated: number }>> {
  const raw = Object.fromEntries(formData);
  const parsed = recordGeneralPaymentSchema.safeParse(raw);

  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { accountId, storeId, amountPaid, paymentMethod, qrChannelId, qrReference, note } = parsed.data;
  const { supabase, user, error: authError } = await requireManagerInStore(storeId);
  if (authError || !supabase || !user) return { data: null, error: authError! };

  const { data: account } = await supabase
    .from("bnpl_accounts")
    .select("id, balance_due")
    .eq("id", accountId)
    .eq("store_id", storeId)
    .single();

  if (!account) return { data: null, error: "Account not found." };

  const balanceDue = Number(account.balance_due);
  if (balanceDue <= 0) return { data: null, error: "This account has no balance due." };
  if (amountPaid > balanceDue) {
    return { data: null, error: "Amount exceeds account balance due." };
  }

  const { data: pendingInstallments, error: pendingError } = await supabase
    .from("bnpl_installments")
    .select("id, amount, due_date, created_at")
    .eq("account_id", accountId)
    .eq("status", "pending")
    .order("due_date", { ascending: true })
    .order("created_at", { ascending: true });

  if (pendingError) return { data: null, error: pendingError.message };
  if (!pendingInstallments || pendingInstallments.length === 0) {
    return { data: null, error: "No pending installments found for this account." };
  }

  const installmentIds = pendingInstallments.map((item) => item.id);
  const { data: existingPayments, error: paymentsError } = await supabase
    .from("bnpl_payments")
    .select("installment_id, amount_paid")
    .eq("account_id", accountId)
    .in("installment_id", installmentIds);

  if (paymentsError) return { data: null, error: paymentsError.message };

  const paidByInstallment = new Map<string, number>();
  for (const payment of existingPayments ?? []) {
    const running = paidByInstallment.get(payment.installment_id) ?? 0;
    paidByInstallment.set(payment.installment_id, running + Number(payment.amount_paid));
  }

  const noteParts: string[] = [];
  if (note?.trim()) noteParts.push(note.trim());
  if (paymentMethod === "qr_transfer") {
    if (qrChannelId) noteParts.push(`[QR_CHANNEL:${qrChannelId}]`);
    if (qrReference?.trim()) noteParts.push(`[QR_REF:${qrReference.trim()}]`);
  }
  const finalNote = noteParts.length > 0 ? noteParts.join(" ") : null;

  const toCents = (value: number) => Math.round(value * 100);
  let remainingCents = toCents(amountPaid);

  const rowsToInsert: Array<{
    installment_id: string;
    account_id: string;
    amount_paid: number;
    payment_method: "cash" | "qr_transfer";
    received_by: string;
    notes: string | null;
  }> = [];

  for (const installment of pendingInstallments) {
    if (remainingCents <= 0) break;

    const totalAmountCents = toCents(Number(installment.amount));
    const paidCents = toCents(paidByInstallment.get(installment.id) ?? 0);
    const outstandingCents = Math.max(0, totalAmountCents - paidCents);
    if (outstandingCents <= 0) continue;

    const allocationCents = Math.min(remainingCents, outstandingCents);
    rowsToInsert.push({
      installment_id: installment.id,
      account_id: accountId,
      amount_paid: allocationCents / 100,
      payment_method: paymentMethod,
      received_by: user.id,
      notes: finalNote,
    });
    remainingCents -= allocationCents;
  }

  if (rowsToInsert.length === 0) {
    return { data: null, error: "No outstanding installment amount found to apply this payment." };
  }

  if (remainingCents > 0) {
    return { data: null, error: "Amount exceeds outstanding pending installment balance." };
  }

  const { error: insertError } = await supabase.from("bnpl_payments").insert(rowsToInsert);
  if (insertError) return { data: null, error: insertError.message };

  revalidatePath(`/dashboard/store/${storeId}/bnpl/${accountId}`);
  revalidatePath(`/dashboard/store/${storeId}/bnpl`);

  return {
    data: {
      appliedAmount: amountPaid,
      paymentsCreated: rowsToInsert.length,
    },
    error: null,
  };
}

export async function markInstallmentPaidAction(
  installmentId: string,
  accountId: string,
  storeId: string,
): Promise<BnplActionResult> {
  const { supabase, error: authError } = await requireManagerInStore(storeId);
  if (authError || !supabase) return { data: null, error: authError! };

  const { error } = await supabase
    .from("bnpl_installments")
    .update({ status: "paid" })
    .eq("id", installmentId)
    .eq("account_id", accountId);

  if (error) return { data: null, error: error.message };

  revalidatePath(`/dashboard/store/${storeId}/bnpl/${accountId}`);
  revalidatePath(`/dashboard/store/${storeId}/bnpl`);
  return { data: null, error: null };
}

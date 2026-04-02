"use server";

import { createClient } from "@/lib/supabase/server";
import { getFirstZodError } from "@/lib/utils/zod";
import type { Result } from "@/types/action";
import { revalidatePath } from "next/cache";
import type { BnplAccountSummary } from "./types";
import {
  createAccountSchema,
  createInstallmentSchema,
  recordGeneralPaymentSchema,
  recordPaymentSchema,
  updateAccountStatusSchema,
} from "./validations";

// ── Helpers ──────────────────────────────────────────────────────────────────

async function requireManagerInStore(storeId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return {
      supabase: null,
      user: null,
      error: "Authentication required.",
      ok: false,
    };

  const { data: membership } = await supabase
    .from("store_members")
    .select("role")
    .eq("store_id", storeId)
    .eq("user_id", user.id)
    .single();

  if (!membership || !["owner", "manager"].includes(membership.role)) {
    return {
      supabase: null,
      user: null,
      error: "Insufficient permissions.",
      ok: false,
    };
  }

  return { supabase, user, error: null, ok: true };
}

// ── Account Actions ──────────────────────────────────────────────────────────

export async function createBnplAccountAction(
  _prevState: Result<BnplAccountSummary>,
  formData: FormData,
): Promise<Result<BnplAccountSummary>> {
  const raw = Object.fromEntries(formData);
  const parsed = createAccountSchema.safeParse(raw);

  if (!parsed.success) {
    return { ok: false, error: getFirstZodError(parsed.error) };
  }

  const { storeId, customerName, phone, creditLimit, notes } = parsed.data;
  const { supabase, error: authError } = await requireManagerInStore(storeId);
  if (authError || !supabase) return { ok: false, error: authError! };

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
      "id, customer_name, customer_phone, credit_limit, balance_due, status, notes, created_at",
    )
    .single();

  if (error || !data)
    return { ok: false, error: error?.message ?? "Failed to create account." };

  revalidatePath(`/dashboard/store/${storeId}/bnpl`);
  return { ok: true, data: data as BnplAccountSummary };
}

export async function updateBnplAccountStatusAction(
  accountId: string,
  storeId: string,
  status: "active" | "frozen" | "closed" | "settled",
): Promise<Result<null>> {
  const parsed = updateAccountStatusSchema.safeParse({
    accountId,
    storeId,
    status,
  });
  if (!parsed.success) return { ok: false, error: "Invalid input." };

  const { supabase, error: authError } = await requireManagerInStore(storeId);
  if (authError || !supabase) return { ok: false, error: authError! };

  const { error } = await supabase
    .from("bnpl_accounts")
    .update({ status })
    .eq("id", accountId)
    .eq("store_id", storeId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/dashboard/store/${storeId}/bnpl`);
  revalidatePath(`/dashboard/store/${storeId}/bnpl/${accountId}`);
  return { ok: true, data: null };
}

// ── Installment Actions ──────────────────────────────────────────────────────

export async function createInstallmentAction(
  _prevState: Result<{ id: string }>,
  formData: FormData,
): Promise<Result<{ id: string }>> {
  const raw = Object.fromEntries(formData);
  const parsed = createInstallmentSchema.safeParse(raw);

  if (!parsed.success)
    return { ok: false, error: getFirstZodError(parsed.error) };

  const { accountId, storeId, amount, dueDate } = parsed.data;
  const { supabase, error: authError } = await requireManagerInStore(storeId);
  if (authError || !supabase) return { ok: false, error: authError! };

  const { data: account } = await supabase
    .from("bnpl_accounts")
    .select("status, credit_limit, balance_due")
    .eq("id", accountId)
    .eq("store_id", storeId)
    .single();

  if (!account) return { ok: false, error: "Account not found." };
  if (account.status !== "active")
    return { ok: false, error: "Account is not active." };
  if (Number(account.balance_due) + amount > Number(account.credit_limit)) {
    return { ok: false, error: "Exceeds credit limit." };
  }

  const { data, error } = await supabase
    .from("bnpl_installments")
    .insert({
      account_id: accountId,
      amount,
      due_date: dueDate,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !data)
    return {
      ok: false,
      error: error?.message ?? "Failed to add installment.",
    };

  // Update balance_due
  await supabase
    .from("bnpl_accounts")
    .update({ balance_due: Number(account.balance_due) + amount })
    .eq("id", accountId);

  revalidatePath(`/dashboard/store/${storeId}/bnpl/${accountId}`);
  revalidatePath(`/dashboard/store/${storeId}/bnpl`);
  return { ok: true, data: { id: data.id } };
}

// ── Payment Actions ──────────────────────────────────────────────────────────

export async function recordBnplPaymentAction(
  _prevState: Result<null>,
  formData: FormData,
): Promise<Result<null>> {
  const raw = Object.fromEntries(formData);
  const parsed = recordPaymentSchema.safeParse(raw);

  if (!parsed.success)
    return { ok: false, error: getFirstZodError(parsed.error) };

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
  const {
    supabase,
    user,
    error: authError,
  } = await requireManagerInStore(storeId);
  if (authError || !supabase || !user) return { ok: false, error: authError! };

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

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/dashboard/store/${storeId}/bnpl/${accountId}`);
  revalidatePath(`/dashboard/store/${storeId}/bnpl`);
  return { ok: true, data: null };
}

export async function recordGeneralBnplPaymentAction(
  _prevState: Result<{
    appliedAmount: number;
    paymentsCreated: number;
  }>,
  formData: FormData,
): Promise<Result<{ appliedAmount: number; paymentsCreated: number }>> {
  const raw = Object.fromEntries(formData);
  const parsed = recordGeneralPaymentSchema.safeParse(raw);

  if (!parsed.success) {
    return { ok: false, error: getFirstZodError(parsed.error) };
  }

  const {
    accountId,
    storeId,
    amountPaid,
    paymentMethod,
    qrChannelId,
    qrReference,
    note,
  } = parsed.data;
  const {
    supabase,
    user,
    error: authError,
  } = await requireManagerInStore(storeId);
  if (authError || !supabase || !user) return { ok: false, error: authError! };

  const { data: account } = await supabase
    .from("bnpl_accounts")
    .select("id, balance_due")
    .eq("id", accountId)
    .eq("store_id", storeId)
    .single();

  if (!account) return { ok: false, error: "Account not found." };

  const balanceDue = Number(account.balance_due);
  if (balanceDue <= 0)
    return { ok: false, error: "This account has no balance due." };
  if (amountPaid > balanceDue) {
    return { ok: false, error: "Amount exceeds account balance due." };
  }

  const { data: pendingInstallments, error: pendingError } = await supabase
    .from("bnpl_installments")
    .select("id, amount, due_date, created_at")
    .eq("account_id", accountId)
    .eq("status", "pending")
    .order("due_date", { ascending: true })
    .order("created_at", { ascending: true });

  if (pendingError) return { ok: false, error: pendingError.message };
  if (!pendingInstallments || pendingInstallments.length === 0) {
    return {
      ok: false,
      error: "No pending installments found for this account.",
    };
  }

  const installmentIds = pendingInstallments.map((item) => item.id);
  const { data: existingPayments, error: paymentsError } = await supabase
    .from("bnpl_payments")
    .select("installment_id, amount_paid")
    .eq("account_id", accountId)
    .in("installment_id", installmentIds);

  if (paymentsError) return { ok: false, error: paymentsError.message };

  const paidByInstallment = new Map<string, number>();
  for (const payment of existingPayments ?? []) {
    const running = paidByInstallment.get(payment.installment_id) ?? 0;
    paidByInstallment.set(
      payment.installment_id,
      running + Number(payment.amount_paid),
    );
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
    return {
      ok: false,
      error: "No outstanding installment amount found to apply this payment.",
    };
  }

  if (remainingCents > 0) {
    return {
      ok: false,
      error: "Amount exceeds outstanding pending installment balance.",
    };
  }

  const { error: insertError } = await supabase
    .from("bnpl_payments")
    .insert(rowsToInsert);
  if (insertError) return { ok: false, error: insertError.message };

  revalidatePath(`/dashboard/store/${storeId}/bnpl/${accountId}`);
  revalidatePath(`/dashboard/store/${storeId}/bnpl`);

  return {
    ok: true,
    data: {
      appliedAmount: amountPaid,
      paymentsCreated: rowsToInsert.length,
    },
  };
}

export async function markInstallmentPaidAction(
  installmentId: string,
  accountId: string,
  storeId: string,
): Promise<Result<null>> {
  const { supabase, error: authError } = await requireManagerInStore(storeId);
  if (authError || !supabase) return { ok: false, error: authError! };

  const { error } = await supabase
    .from("bnpl_installments")
    .update({ status: "paid" })
    .eq("id", installmentId)
    .eq("account_id", accountId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/dashboard/store/${storeId}/bnpl/${accountId}`);
  revalidatePath(`/dashboard/store/${storeId}/bnpl`);
  return { ok: true, data: null };
}

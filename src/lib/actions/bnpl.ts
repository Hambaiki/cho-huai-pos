"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
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
  const supabase = await createClient();
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
  storeId: z.string().uuid(),
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
  accountId: z.string().uuid(),
  storeId: z.string().uuid(),
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
  accountId: z.string().uuid(),
  storeId: z.string().uuid(),
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
  installmentId: z.string().uuid(),
  accountId: z.string().uuid(),
  storeId: z.string().uuid(),
  amountPaid: z.coerce.number().positive("Amount must be positive"),
  paymentMethod: z.enum(["cash", "qr_transfer", "card"]),
  note: z.string().optional(),
});

export async function recordBnplPaymentAction(
  _prevState: BnplActionResult,
  formData: FormData,
): Promise<BnplActionResult> {
  const raw = Object.fromEntries(formData);
  const parsed = recordPaymentSchema.safeParse(raw);

  if (!parsed.success) return { data: null, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const { installmentId, accountId, storeId, amountPaid, paymentMethod, note } = parsed.data;
  const { supabase, user, error: authError } = await requireManagerInStore(storeId);
  if (authError || !supabase || !user) return { data: null, error: authError! };

  // The DB trigger handles balance_due update on bnpl_accounts
  const { error } = await supabase.from("bnpl_payments").insert({
    installment_id: installmentId,
    account_id: accountId,
    amount_paid: amountPaid,
    payment_method: paymentMethod,
    received_by: user.id,
    note: note || null,
  });

  if (error) return { data: null, error: error.message };

  revalidatePath(`/dashboard/store/${storeId}/bnpl/${accountId}`);
  revalidatePath(`/dashboard/store/${storeId}/bnpl`);
  return { data: null, error: null };
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

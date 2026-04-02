import type { Tables } from "@/lib/supabase/types";

export type BnplAccountRow = Tables<"bnpl_accounts">;

export type BnplInstallmentRow = Tables<"bnpl_installments">;

export type BnplPaymentRow = Tables<"bnpl_payments">;

export type BnplAccountSummary = Pick<
  Tables<"bnpl_accounts">,
  | "id"
  | "customer_name"
  | "customer_phone"
  | "credit_limit"
  | "balance_due"
  | "status"
  | "notes"
> & {
  created_at: string;
};

export type PaymentMethod = Extract<
  Tables<"bnpl_payments">["payment_method"],
  "cash" | "qr_transfer" | "bnpl"
>;

export type AccountStatus = Tables<"bnpl_accounts">["status"];

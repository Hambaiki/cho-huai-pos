import type { Tables } from "@/lib/supabase/types";

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

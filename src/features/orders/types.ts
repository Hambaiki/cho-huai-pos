import { Tables } from "@/lib/supabase/types";

export type Order = Pick<
  Tables<"orders">,
  "id" | "total" | "payment_method" | "status" | "created_at" | "cashier_id"
>;

export type OrderStatus = Tables<"orders">["status"];

export type PaymentMethod = Extract<
  Tables<"bnpl_payments">["payment_method"],
  "cash" | "qr_transfer" | "bnpl"
>;

export type PaginatedOrderRow = Pick<
  Tables<"orders">,
  "id" | "total" | "payment_method" | "status" | "created_at" | "cashier_id"
> & { total_count: number };

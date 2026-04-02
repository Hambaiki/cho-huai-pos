import { Tables } from "@/lib/supabase/types";

export type PaymentMethod = Extract<
  Tables<"bnpl_payments">["payment_method"],
  "cash" | "qr_transfer" | "bnpl"
>;

export interface PaymentConfirmPayload {
  paymentMethod: PaymentMethod;
  amountTendered?: number;
  qrChannelId?: string;
  qrReference?: string;
  bnplAccountId?: string;
  bnplDueDate?: string;
}

export interface ReceiptItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
}

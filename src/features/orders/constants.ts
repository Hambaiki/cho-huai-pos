import { OrderStatus, PaymentMethod } from "./types";

export const STATUS_OPTIONS: { label: string; value: OrderStatus }[] = [
  { label: "Completed", value: "completed" },
  { label: "Voided", value: "voided" },
  { label: "Refunded", value: "refunded" },
];

export const METHOD_OPTIONS: { label: string; value: PaymentMethod }[] = [
  { label: "Cash", value: "cash" },
  { label: "QR Transfer", value: "qr_transfer" },
  { label: "BNPL", value: "bnpl" },
];

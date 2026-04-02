import { z } from "zod";

// ── Account Validations ──────────────────────────────────────────────────────

export const createAccountSchema = z.object({
  storeId: z.uuid(),
  customerName: z.string().min(1, "Customer name is required"),
  phone: z.string().optional(),
  creditLimit: z.coerce.number().positive("Credit limit must be positive"),
  notes: z.string().optional(),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;

// ── Account Status Validations ───────────────────────────────────────────────

export const updateAccountStatusSchema = z.object({
  accountId: z.uuid(),
  storeId: z.uuid(),
  status: z.enum(["active", "frozen", "closed", "settled"]),
});

export type UpdateAccountStatusInput = z.infer<
  typeof updateAccountStatusSchema
>;

// ── Installment Validations ──────────────────────────────────────────────────

export const createInstallmentSchema = z.object({
  accountId: z.uuid(),
  storeId: z.uuid(),
  amount: z.coerce.number().positive("Amount must be positive"),
  dueDate: z.string().min(1, "Due date is required"),
});

export type CreateInstallmentInput = z.infer<typeof createInstallmentSchema>;

// ── Payment Validations ──────────────────────────────────────────────────────

export const recordPaymentSchema = z.object({
  installmentId: z.uuid(),
  accountId: z.uuid(),
  storeId: z.uuid(),
  amountPaid: z.coerce.number().positive("Amount must be positive"),
  paymentMethod: z.enum(["cash", "qr_transfer"]),
  qrChannelId: z.uuid().optional(),
  qrReference: z.string().trim().max(120).optional(),
  note: z.string().optional(),
});

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;

export const recordGeneralPaymentSchema = z.object({
  accountId: z.uuid(),
  storeId: z.uuid(),
  amountPaid: z.coerce.number().positive("Amount must be positive"),
  paymentMethod: z.enum(["cash", "qr_transfer"]),
  qrChannelId: z.uuid().optional(),
  qrReference: z.string().trim().max(120).optional(),
  note: z.string().optional(),
});

export type RecordGeneralPaymentInput = z.infer<
  typeof recordGeneralPaymentSchema
>;

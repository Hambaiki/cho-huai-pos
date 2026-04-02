import { z } from "zod";

// ── Receive Stock ────────────────────────────────────────────────────────────

export const receiveStockSchema = z.object({
  storeId: z.uuid(),
  productId: z.uuid(),
  quantity: z.number().int().positive("Quantity must be at least 1"),
  unitCost: z.number().min(0, "Unit cost must be 0 or more"),
  sourceRef: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});

export type ReceiveStockInput = z.infer<typeof receiveStockSchema>;

// ── Adjust Stock ─────────────────────────────────────────────────────────────

export const adjustStockSchema = z
  .object({
    storeId: z.uuid(),
    productId: z.uuid(),
    direction: z.enum(["increase", "decrease"]),
    reason: z.enum(["return", "damage", "loss", "correction", "initial"]),
    quantity: z.number().int().positive("Quantity must be at least 1"),
    unitCost: z.number().min(0, "Unit cost must be 0 or more").optional(),
    notes: z.string().max(500).optional(),
  })
  .superRefine((value, ctx) => {
    if (
      value.direction === "increase" &&
      !["return", "correction", "initial"].includes(value.reason)
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Use return, correction, or initial for stock increases.",
        path: ["reason"],
      });
    }

    if (
      value.direction === "decrease" &&
      !["damage", "loss", "correction"].includes(value.reason)
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Use damage, loss, or correction for stock decreases.",
        path: ["reason"],
      });
    }

    if (value.direction === "increase" && value.unitCost == null) {
      ctx.addIssue({
        code: "custom",
        message: "Unit cost is required when increasing stock.",
        path: ["unitCost"],
      });
    }
  });

export type AdjustStockInput = z.infer<typeof adjustStockSchema>;

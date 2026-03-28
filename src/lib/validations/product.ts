import { z } from "zod";

export const productFormSchema = z.object({
  name: z.string().min(2, "Product name is required").max(120),
  sku: z.string().max(50).optional(),
  barcode: z.string().max(50).optional(),
  categoryId: z.uuid().optional(),
  price: z.number().min(0, "Price must be 0 or more"),
  costPrice: z.number().min(0, "Cost price must be 0 or more").optional(),
  stockQty: z.number().int().min(0, "Stock quantity must be 0 or more"),
  lowStockAt: z.number().int().min(0, "Low stock alert must be 0 or more"),
  unit: z.string().max(20).default("pc"),
});

export type ProductFormInput = z.infer<typeof productFormSchema>;

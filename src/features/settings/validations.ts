import { z } from "zod";

export const categorySchema = z.object({
  storeId: z.uuid(),
  categoryId: z.uuid().optional(),
  name: z.string().min(1).max(80).trim(),
  sortOrder: z.number().int().min(0).max(9999),
});

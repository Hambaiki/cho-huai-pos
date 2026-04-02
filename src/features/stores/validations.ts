import { z } from "zod";

export const createStoreSchema = z.object({
  name: z.string().min(2).max(120).trim(),
  address: z.string().max(300).optional(),
  currency_code: z
    .string()
    .min(3)
    .max(3)
    .transform((value) => value.toUpperCase()),
  currency_symbol: z.string().min(1).max(6).trim(),
  currency_decimals: z.coerce.number().int().min(0).max(4),
  symbol_position: z.enum(["prefix", "suffix"]),
});

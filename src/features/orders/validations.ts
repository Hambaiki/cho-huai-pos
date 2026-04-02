import { z } from "zod";

export const createOrderSchema = z.object({
  storeId: z.uuid(),
  paymentMethod: z.enum(["cash", "qr_transfer", "split", "bnpl"]),
  amountTendered: z.number().nonnegative().optional(),
  orderDiscount: z.number().nonnegative().default(0),
  promoCode: z.string().trim().max(32).optional(),
  qrChannelId: z.uuid().optional(),
  qrReference: z.string().optional(),
  bnplAccountId: z.uuid().optional(),
  bnplDueDate: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.uuid(),
        productName: z.string().min(1),
        unitPrice: z.number().nonnegative(),
        quantity: z.number().int().positive(),
        discount: z.number().nonnegative().default(0),
      }),
    )
    .min(1),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export type CreateOrderResult =
  | {
      data: {
        orderId: string;
        subtotal: number;
        discount: number;
        taxAmount: number;
        total: number;
        amountTendered: number | null;
        changeAmount: number;
        paymentMethod: string;
        items: Array<{
          productName: string;
          quantity: number;
          unitPrice: number;
          discount: number;
          subtotal: number;
        }>;
        createdAt: string;
      };
      error: null;
    }
  | { data: null; error: string };

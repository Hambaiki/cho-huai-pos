export type PromotionType = "fixed_amount" | "percentage";

export interface StorePromotionRow {
  id: string;
  name: string;
  code: string | null;
  type: PromotionType;
  value: number;
  min_order_total: number;
  max_discount_amount: number | null;
  max_redemptions: number | null;
  applies_automatically: boolean;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}

export type PromotionsActionResult<T = null> =
  | { data: T; error: null }
  | { data: null; error: string };

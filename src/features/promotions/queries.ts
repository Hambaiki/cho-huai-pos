import { createClient } from "@/lib/supabase/server";
import type { StoreMemberRole } from "@/features/settings/types";
import type { StorePromotionRow } from "./types";

export async function getPromotionsPageData({
  userId,
  storeId,
}: {
  userId: string;
  storeId: string;
}) {
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("store_members")
    .select("role")
    .eq("user_id", userId)
    .eq("store_id", storeId)
    .maybeSingle();

  if (!membership) return null;

  const { data: store } = await supabase
    .from("stores")
    .select("id, name, currency_code, currency_symbol, currency_decimals, symbol_position")
    .eq("id", storeId)
    .maybeSingle();

  if (!store) return null;

  const { data: promotions, error } = await supabase
    .from("store_promotions")
    .select(
      "id, name, code, type, value, min_order_total, max_discount_amount, max_redemptions, applies_automatically, is_active, starts_at, ends_at, created_at",
    )
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  if (error && !["PGRST205", "42P01"].includes((error as { code?: string }).code ?? "")) {
    throw new Error(error.message);
  }

  return {
    role: membership.role as StoreMemberRole,
    store,
    promotions: ((error ? [] : promotions) ?? []) as StorePromotionRow[],
  };
}

export async function getAvailablePromotions(storeId: string) {
  const supabase = await createClient();
  const now = new Date();

  const { data: promotions, error } = await supabase
    .from("store_promotions")
    .select(
      "id, name, code, type, value, min_order_total, max_discount_amount, max_redemptions, applies_automatically, starts_at, ends_at",
    )
    .eq("store_id", storeId)
    .eq("is_active", true);

  if (error) {
    const errorCode = (error as { code?: string }).code;
    if (["PGRST205", "42P01"].includes(errorCode ?? "")) {
      return [];
    }
    return [];
  }

  // Filter by time window and return only active automatic promotions and promo codes
  return ((promotions ?? []) as Array<{
    id: string;
    name: string;
    code: string | null;
    type: string;
    value: number;
    min_order_total: number | null;
    max_discount_amount: number | null;
    max_redemptions: number | null;
    applies_automatically: boolean;
    starts_at: string | null;
    ends_at: string | null;
  }>)
    .filter((p) => {
      const startsAt = p.starts_at ? new Date(p.starts_at) : null;
      const endsAt = p.ends_at ? new Date(p.ends_at) : null;

      if (startsAt && startsAt > now) return false;
      if (endsAt && endsAt < now) return false;

      return true;
    })
    .map((p) => ({
      id: p.id,
      name: p.name,
      code: p.code,
      type: p.type,
      isAutomatic: p.applies_automatically,
    }));
}

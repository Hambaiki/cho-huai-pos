"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { PromotionsActionResult } from "./types";

const createPromotionSchema = z.object({
  storeId: z.uuid(),
  name: z.string().trim().min(2).max(120),
  code: z.string().trim().max(32).optional(),
  type: z.enum(["fixed_amount", "percentage"]),
  value: z.number().positive(),
  minOrderTotal: z.number().nonnegative().default(0),
  maxDiscountAmount: z.number().nonnegative().optional(),
  maxRedemptions: z.number().int().positive().optional(),
  appliesAutomatically: z.boolean().default(false),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
});

async function requireManager(
  storeId: string,
): Promise<PromotionsActionResult<{ userId: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { data: null, error: "Authentication required." };

  const { data: membership } = await supabase
    .from("store_members")
    .select("role")
    .eq("store_id", storeId)
    .eq("user_id", user.id)
    .single();

  if (!membership || !["owner", "manager"].includes(membership.role)) {
    return {
      data: null,
      error: "Only owners or managers can manage promotions.",
    };
  }

  return { data: { userId: user.id }, error: null };
}

export async function createPromotionAction(
  input: z.infer<typeof createPromotionSchema>,
): Promise<PromotionsActionResult> {
  const parsed = createPromotionSchema.safeParse(input);

  if (!parsed.success) {
    return { data: null, error: "Invalid promotion input." };
  }

  if (parsed.data.type === "percentage" && parsed.data.value > 100) {
    return { data: null, error: "Percentage promotions cannot exceed 100%." };
  }

  const guard = await requireManager(parsed.data.storeId);
  if (guard.error) return guard;

  const supabase = await createClient();

  const code = parsed.data.appliesAutomatically
    ? null
    : (parsed.data.code?.trim().toUpperCase() ?? null);

  if (!parsed.data.appliesAutomatically && !code) {
    return {
      data: null,
      error: "Promo code is required for non-automatic promotions.",
    };
  }

  const startsAt = parsed.data.startsAt?.trim() ? parsed.data.startsAt : null;
  const endsAt = parsed.data.endsAt?.trim() ? parsed.data.endsAt : null;

  const { error } = await supabase.from("store_promotions").insert({
    store_id: parsed.data.storeId,
    name: parsed.data.name,
    code,
    type: parsed.data.type,
    value: parsed.data.value,
    min_order_total: parsed.data.minOrderTotal,
    max_discount_amount: parsed.data.maxDiscountAmount ?? null,
    max_redemptions: parsed.data.maxRedemptions ?? null,
    applies_automatically: parsed.data.appliesAutomatically,
    starts_at: startsAt,
    ends_at: endsAt,
    created_by: guard.data?.userId,
  });

  if (error) {
    if (
      ["PGRST205", "42P01"].includes((error as { code?: string }).code ?? "")
    ) {
      return {
        data: null,
        error: "Promotions migration has not been applied yet.",
      };
    }
    return { data: null, error: error.message };
  }

  revalidatePath(`/dashboard/store/${parsed.data.storeId}/promotions`);
  revalidatePath(`/dashboard/store/${parsed.data.storeId}/pos`);

  return { data: null, error: null };
}

export async function togglePromotionStatusAction({
  promotionId,
  storeId,
  isActive,
}: {
  promotionId: string;
  storeId: string;
  isActive: boolean;
}): Promise<PromotionsActionResult> {
  if (!promotionId || !storeId) {
    return { data: null, error: "Invalid promotion action." };
  }

  const guard = await requireManager(storeId);
  if (guard.error) return guard;

  const supabase = await createClient();

  const { error } = await supabase
    .from("store_promotions")
    .update({ is_active: isActive })
    .eq("id", promotionId)
    .eq("store_id", storeId);

  if (error) {
    if (
      ["PGRST205", "42P01"].includes((error as { code?: string }).code ?? "")
    ) {
      return {
        data: null,
        error: "Promotions migration has not been applied yet.",
      };
    }
    return { data: null, error: error.message };
  }

  revalidatePath(`/dashboard/store/${storeId}/promotions`);
  revalidatePath(`/dashboard/store/${storeId}/pos`);

  return { data: null, error: null };
}

export async function validatePromoCodeAction({
  storeId,
  promoCode,
  orderTotal,
}: {
  storeId: string;
  promoCode: string;
  orderTotal: number;
}): Promise<
  | {
      isValid: true;
      discount: number;
      message: string;
    }
  | {
      isValid: false;
      error: string;
    }
> {
  if (!promoCode || promoCode.trim() === "") {
    return { isValid: false, error: "Please enter a promo code." };
  }

  const supabase = await createClient();

  const now = new Date();
  const normalizedCode = promoCode.trim().toUpperCase();

  const { data: promotions, error } = await supabase
    .from("store_promotions")
    .select(
      "id, code, type, value, min_order_total, max_discount_amount, max_redemptions, applies_automatically, starts_at, ends_at",
    )
    .eq("store_id", storeId)
    .eq("is_active", true);

  if (error) {
    // Handle case where table might not exist
    const errorCode = (error as { code?: string }).code;
    if (["PGRST205", "42P01"].includes(errorCode ?? "")) {
      return { isValid: false, error: "Promotions are not available." };
    }
    return { isValid: false, error: error.message };
  }

  // Find matching promo code (not automatic)
  const promotion = (promotions ?? []).find((p) => {
    if (p.applies_automatically) return false;
    if (p.code?.toUpperCase() !== normalizedCode) return false;

    // Check time window
    const startsAt = p.starts_at ? new Date(p.starts_at) : null;
    const endsAt = p.ends_at ? new Date(p.ends_at) : null;

    if (startsAt && startsAt > now) return false;
    if (endsAt && endsAt < now) return false;

    return true;
  });

  if (!promotion) {
    return { isValid: false, error: "Promo code is invalid or inactive." };
  }

  const minOrderTotal = Number(promotion.min_order_total ?? 0);
  if (orderTotal < minOrderTotal) {
    return {
      isValid: false,
      error: `Minimum order total of ${minOrderTotal} required for this promo code.`,
    };
  }

  const maxRedemptions =
    promotion.max_redemptions === null
      ? null
      : Number(promotion.max_redemptions);

  if (maxRedemptions !== null) {
    const { count, error: countError } = await supabase
      .from("promotion_redemptions")
      .select("id", { count: "exact", head: true })
      .eq("promotion_id", promotion.id);

    if (countError) {
      return { isValid: false, error: countError.message };
    }

    if ((count ?? 0) >= maxRedemptions) {
      return { isValid: false, error: "Promo code usage limit has been reached." };
    }
  }

  // Calculate discount
  const discount = calculateDiscount(
    {
      type: promotion.type as "fixed_amount" | "percentage",
      value: Number(promotion.value ?? 0),
      maxDiscountAmount:
        promotion.max_discount_amount === null
          ? null
          : Number(promotion.max_discount_amount),
    },
    orderTotal,
  );

  return {
    isValid: true,
    discount,
    message: `Promo code applied! Save ${formatDiscountMessage(promotion.type as "fixed_amount" | "percentage", discount)}`,
  };
}

function calculateDiscount(
  promotion: {
    type: "fixed_amount" | "percentage";
    value: number;
    maxDiscountAmount: number | null;
  },
  amount: number,
) {
  if (amount <= 0) return 0;

  const rawDiscount =
    promotion.type === "percentage"
      ? (amount * promotion.value) / 100
      : promotion.value;

  const withCap =
    promotion.maxDiscountAmount !== null
      ? Math.min(rawDiscount, promotion.maxDiscountAmount)
      : rawDiscount;

  return roundMoney(Math.max(0, Math.min(withCap, amount)));
}

function roundMoney(value: number) {
  return Number(value.toFixed(2));
}

function formatDiscountMessage(
  type: "fixed_amount" | "percentage",
  discount: number,
) {
  if (type === "percentage") {
    return `${discount.toFixed(0)} baht`;
  }
  return `${discount.toFixed(2)} baht`;
}

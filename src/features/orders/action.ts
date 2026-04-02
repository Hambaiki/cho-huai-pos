"use server";

import {
  CreateOrderInput,
  CreateOrderResult,
  createOrderSchema,
} from "@/features/orders/validations";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const DEFAULT_MAX_ORDER_DISCOUNT_AMOUNT = 300;
const DEFAULT_MAX_ORDER_DISCOUNT_PERCENTAGE = 10;

function roundMoney(value: number) {
  return Number(value.toFixed(2));
}

type StorePromotion = {
  id: string;
  code: string | null;
  type: "fixed_amount" | "percentage";
  value: number;
  min_order_total: number;
  max_discount_amount: number | null;
  max_redemptions: number | null;
  applies_automatically: boolean;
};

function calculatePromotionDiscount(promotion: StorePromotion, amount: number) {
  if (amount <= 0) return 0;

  const rawDiscount =
    promotion.type === "percentage"
      ? (amount * promotion.value) / 100
      : promotion.value;

  const withCap =
    promotion.max_discount_amount !== null
      ? Math.min(rawDiscount, promotion.max_discount_amount)
      : rawDiscount;

  return roundMoney(Math.max(0, Math.min(withCap, amount)));
}

export async function createOrderAction(
  input: CreateOrderInput,
): Promise<CreateOrderResult> {
  const parsed = createOrderSchema.safeParse(input);

  if (!parsed.success) {
    return { data: null, error: "Invalid order input." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { data: null, error: "Please sign in again." };
  }

  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select(
      "id, tax_rate, max_cashier_order_discount_amount, max_cashier_order_discount_percentage",
    )
    .eq("id", parsed.data.storeId)
    .single();

  if (storeError || !store) {
    return { data: null, error: storeError?.message ?? "Store not found." };
  }

  const maxOrderDiscountAmountSetting = Number(
    store.max_cashier_order_discount_amount ??
      DEFAULT_MAX_ORDER_DISCOUNT_AMOUNT,
  );

  const maxOrderDiscountPercentageSetting = Number(
    store.max_cashier_order_discount_percentage ??
      DEFAULT_MAX_ORDER_DISCOUNT_PERCENTAGE,
  );

  const subtotal = roundMoney(
    parsed.data.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
    ),
  );

  const now = new Date();

  const { data: activePromotions, error: promotionsError } = await supabase
    .from("store_promotions")
    .select(
      "id, code, type, value, min_order_total, max_discount_amount, max_redemptions, applies_automatically, starts_at, ends_at",
    )
    .eq("store_id", parsed.data.storeId)
    .eq("is_active", true);

  if (promotionsError) {
    const errorCode = (promotionsError as { code?: string }).code;
    if (!["PGRST205", "42P01"].includes(errorCode ?? "")) {
      return { data: null, error: promotionsError.message };
    }
  }

  const promotions = (((promotionsError ? [] : activePromotions) ?? []) as Array<
    StorePromotion & { starts_at: string | null; ends_at: string | null }
  >).filter((promotion) => {
    const startsAt = promotion.starts_at ? new Date(promotion.starts_at) : null;
    const endsAt = promotion.ends_at ? new Date(promotion.ends_at) : null;

    if (startsAt && startsAt > now) return false;
    if (endsAt && endsAt < now) return false;

    return true;
  });

  const hasInvalidItemDiscount = parsed.data.items.some(
    (item) => item.discount > item.unitPrice,
  );

  if (hasInvalidItemDiscount) {
    return {
      data: null,
      error: "Item discount cannot exceed unit price.",
    };
  }

  const itemDiscountTotal = roundMoney(
    parsed.data.items.reduce((sum, item) => sum + item.discount * item.quantity, 0),
  );

  const requestedOrderDiscount = roundMoney(parsed.data.orderDiscount ?? 0);
  const maxOrderDiscountByAmount = Number.isFinite(maxOrderDiscountAmountSetting)
    ? Math.max(0, maxOrderDiscountAmountSetting)
    : DEFAULT_MAX_ORDER_DISCOUNT_AMOUNT;
  const maxOrderDiscountByPercent =
    Number.isFinite(maxOrderDiscountPercentageSetting) &&
    maxOrderDiscountPercentageSetting >= 0
      ? roundMoney((subtotal * maxOrderDiscountPercentageSetting) / 100)
      : roundMoney((subtotal * DEFAULT_MAX_ORDER_DISCOUNT_PERCENTAGE) / 100);
  const maxOrderDiscount = Math.min(
    maxOrderDiscountByAmount,
    maxOrderDiscountByPercent,
  );

  if (requestedOrderDiscount > maxOrderDiscount) {
    return {
      data: null,
      error: `Order discount exceeds cashier limit (${roundMoney(maxOrderDiscount)}).`,
    };
  }

  const baseAfterManualDiscount = Math.max(
    0,
    roundMoney(subtotal - itemDiscountTotal - requestedOrderDiscount),
  );

  const eligibleAutomaticPromotions = promotions.filter(
    (promotion) =>
      promotion.applies_automatically &&
      baseAfterManualDiscount >= Number(promotion.min_order_total ?? 0),
  );

  let appliedAutomaticPromotion: StorePromotion | null = null;
  let automaticDiscount = 0;

  for (const promotion of eligibleAutomaticPromotions) {
    const candidateDiscount = calculatePromotionDiscount(
      {
        ...promotion,
        value: Number(promotion.value ?? 0),
        min_order_total: Number(promotion.min_order_total ?? 0),
        max_discount_amount:
          promotion.max_discount_amount === null
            ? null
            : Number(promotion.max_discount_amount),
      },
      baseAfterManualDiscount,
    );

    if (candidateDiscount > automaticDiscount) {
      automaticDiscount = candidateDiscount;
      appliedAutomaticPromotion = promotion;
    }
  }

  const baseAfterAutomatic = Math.max(
    0,
    roundMoney(baseAfterManualDiscount - automaticDiscount),
  );

  const normalizedPromoCode = parsed.data.promoCode?.trim().toUpperCase();
  let appliedCodePromotion: StorePromotion | null = null;
  let promoCodeDiscount = 0;

  if (normalizedPromoCode) {
    const matchingCodePromotion = promotions.find(
      (promotion) =>
        !promotion.applies_automatically &&
        promotion.code?.toUpperCase() === normalizedPromoCode,
    );

    if (!matchingCodePromotion) {
      return { data: null, error: "Promo code is invalid or inactive." };
    }

    if (baseAfterAutomatic < Number(matchingCodePromotion.min_order_total ?? 0)) {
      return {
        data: null,
        error: "Promo code requirements are not met for this order total.",
      };
    }

    const maxRedemptions =
      matchingCodePromotion.max_redemptions === null
        ? null
        : Number(matchingCodePromotion.max_redemptions);

    if (maxRedemptions !== null) {
      const { count: redemptionCount, error: redemptionCountError } = await supabase
        .from("promotion_redemptions")
        .select("id", { count: "exact", head: true })
        .eq("promotion_id", matchingCodePromotion.id);

      if (redemptionCountError) {
        return { data: null, error: redemptionCountError.message };
      }

      if ((redemptionCount ?? 0) >= maxRedemptions) {
        return {
          data: null,
          error: "Promo code usage limit has been reached.",
        };
      }
    }

    appliedCodePromotion = matchingCodePromotion;
    promoCodeDiscount = calculatePromotionDiscount(
      {
        ...matchingCodePromotion,
        value: Number(matchingCodePromotion.value ?? 0),
        min_order_total: Number(matchingCodePromotion.min_order_total ?? 0),
        max_discount_amount:
          matchingCodePromotion.max_discount_amount === null
            ? null
            : Number(matchingCodePromotion.max_discount_amount),
      },
      baseAfterAutomatic,
    );
  }

  const discount = roundMoney(
    itemDiscountTotal + requestedOrderDiscount + automaticDiscount + promoCodeDiscount,
  );
  const taxableBase = Math.max(0, roundMoney(subtotal - discount));
  const taxRate = Number(store.tax_rate ?? 0);
  const taxAmount = roundMoney(
    taxableBase * ((Number.isFinite(taxRate) ? taxRate : 0) / 100),
  );
  const total = roundMoney(taxableBase + taxAmount);
  const isBnpl = parsed.data.paymentMethod === "bnpl";

  if (
    parsed.data.paymentMethod === "cash" &&
    (parsed.data.amountTendered === undefined || parsed.data.amountTendered < total)
  ) {
    return { data: null, error: "Cash amount tendered is less than total." };
  }

  if (isBnpl && !parsed.data.bnplAccountId) {
    return { data: null, error: "Select a BNPL account before checkout." };
  }

  if (isBnpl && !parsed.data.bnplDueDate) {
    return { data: null, error: "Set a BNPL due date before checkout." };
  }

  const productIds = [
    ...new Set(parsed.data.items.map((item) => item.productId)),
  ];
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, cost_price")
    .eq("store_id", parsed.data.storeId)
    .in("id", productIds);

  if (productsError) {
    return { data: null, error: productsError.message };
  }

  if ((products?.length ?? 0) !== productIds.length) {
    return {
      data: null,
      error: "One or more products could not be loaded for checkout.",
    };
  }

  const productCostMap = new Map(
    (products ?? []).map((product) => [product.id, product.cost_price]),
  );

  let bnplAccount: {
    id: string;
    balance_due: number;
  } | null = null;

  if (isBnpl) {
    const { data: account, error: accountError } = await supabase
      .from("bnpl_accounts")
      .select("id, status, credit_limit, balance_due")
      .eq("id", parsed.data.bnplAccountId!)
      .eq("store_id", parsed.data.storeId)
      .single();

    if (accountError || !account) {
      return { data: null, error: "The selected BNPL account was not found." };
    }

    if (account.status !== "active") {
      return {
        data: null,
        error: "Only active BNPL accounts can be used for checkout.",
      };
    }

    if (Number(account.balance_due) + total > Number(account.credit_limit)) {
      return {
        data: null,
        error: "This BNPL account does not have enough available credit.",
      };
    }

    bnplAccount = {
      id: account.id,
      balance_due: Number(account.balance_due),
    };
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      store_id: parsed.data.storeId,
      cashier_id: user.id,
      subtotal,
      discount,
      tax_amount: taxAmount,
      total,
      amount_tendered: isBnpl ? null : (parsed.data.amountTendered ?? null),
      change_amount:
        !isBnpl &&
        parsed.data.amountTendered &&
        parsed.data.amountTendered > total
          ? roundMoney(parsed.data.amountTendered - total)
          : 0,
      payment_method: parsed.data.paymentMethod,
      qr_channel_id: parsed.data.qrChannelId ?? null,
      qr_reference: parsed.data.qrReference ?? null,
      bnpl_account_id: parsed.data.bnplAccountId ?? null,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return {
      data: null,
      error: orderError?.message ?? "Failed to create order.",
    };
  }

  const rollbackOrder = async () => {
    await supabase.from("orders").delete().eq("id", order.id);
  };

  const itemRows = parsed.data.items.map((item) => ({
    order_id: order.id,
    product_id: item.productId,
    product_name: item.productName,
    unit_price: item.unitPrice,
    unit_cost: productCostMap.get(item.productId) ?? null,
    quantity: item.quantity,
    discount: item.discount,
    subtotal: item.unitPrice * item.quantity - item.discount * item.quantity,
  }));

  const { error: itemError } = await supabase
    .from("order_items")
    .insert(itemRows);

  if (itemError) {
    await rollbackOrder();
    return { data: null, error: itemError.message };
  }

  const redemptionRows: Array<{
    promotion_id: string;
    order_id: string;
    discount_amount: number;
  }> = [];

  if (appliedAutomaticPromotion && automaticDiscount > 0) {
    redemptionRows.push({
      promotion_id: appliedAutomaticPromotion.id,
      order_id: order.id,
      discount_amount: automaticDiscount,
    });
  }

  if (appliedCodePromotion && promoCodeDiscount > 0) {
    redemptionRows.push({
      promotion_id: appliedCodePromotion.id,
      order_id: order.id,
      discount_amount: promoCodeDiscount,
    });
  }

  if (redemptionRows.length > 0) {
    const { error: redemptionError } = await supabase
      .from("promotion_redemptions")
      .insert(redemptionRows);

    if (redemptionError) {
      await rollbackOrder();
      return { data: null, error: redemptionError.message };
    }
  }

  let bnplInstallmentId: string | null = null;

  if (isBnpl && bnplAccount) {
    const { data: installment, error: installmentError } = await supabase
      .from("bnpl_installments")
      .insert({
        account_id: bnplAccount.id,
        order_id: order.id,
        amount: total,
        due_date: parsed.data.bnplDueDate!,
        status: "pending",
      })
      .select("id")
      .single();

    if (installmentError || !installment) {
      await rollbackOrder();
      return {
        data: null,
        error:
          installmentError?.message ?? "Failed to create the BNPL installment.",
      };
    }

    bnplInstallmentId = installment.id;

    const { error: bnplBalanceError } = await supabase
      .from("bnpl_accounts")
      .update({ balance_due: bnplAccount.balance_due + total })
      .eq("id", bnplAccount.id)
      .eq("store_id", parsed.data.storeId);

    if (bnplBalanceError) {
      await supabase
        .from("bnpl_installments")
        .delete()
        .eq("id", bnplInstallmentId);
      await rollbackOrder();
      return { data: null, error: bnplBalanceError.message };
    }
  }

  const { error: stockError } = await supabase.rpc("process_order_stock", {
    p_order_id: order.id,
  });

  if (stockError) {
    if (isBnpl && bnplAccount && bnplInstallmentId) {
      await supabase
        .from("bnpl_installments")
        .delete()
        .eq("id", bnplInstallmentId);
      await supabase
        .from("bnpl_accounts")
        .update({ balance_due: bnplAccount.balance_due })
        .eq("id", bnplAccount.id)
        .eq("store_id", parsed.data.storeId);
    }

    await rollbackOrder();
    return { data: null, error: stockError.message };
  }

  revalidatePath(`/dashboard/store/${parsed.data.storeId}/pos`);
  revalidatePath(`/dashboard/store/${parsed.data.storeId}/orders`);
  revalidatePath(`/dashboard/store/${parsed.data.storeId}`);
  revalidatePath(`/dashboard/store/${parsed.data.storeId}/reports`);

  return {
    data: {
      orderId: order.id,
      subtotal,
      discount,
      taxAmount,
      total,
      amountTendered: isBnpl ? null : (parsed.data.amountTendered ?? null),
      changeAmount:
        !isBnpl &&
        parsed.data.amountTendered &&
        parsed.data.amountTendered > total
          ? roundMoney(parsed.data.amountTendered - total)
          : 0,
      paymentMethod: parsed.data.paymentMethod,
      items: parsed.data.items.map((item) => ({
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        subtotal:
          item.unitPrice * item.quantity - item.discount * item.quantity,
      })),
      createdAt: new Date().toISOString(),
    },
    error: null,
  };
}

export type VoidOrderResult =
  | { data: { success: true }; error: null }
  | { data: null; error: string };

export async function voidOrderAction(
  orderId: string,
  reason: string,
): Promise<VoidOrderResult> {
  if (!orderId || !reason.trim()) {
    return { data: null, error: "Order ID and reason are required." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { data: null, error: "Authentication required." };
  }

  // Verify the order belongs to a store the user has manager+ access to
  const { data: order } = await supabase
    .from("orders")
    .select("id, store_id, status")
    .eq("id", orderId)
    .single();

  if (!order) return { data: null, error: "Order not found." };
  if (order.status !== "completed")
    return { data: null, error: "Only completed orders can be voided." };

  const { data: membership } = await supabase
    .from("store_members")
    .select("role")
    .eq("store_id", order.store_id)
    .eq("user_id", user.id)
    .single();

  if (!membership || !["owner", "manager"].includes(membership.role)) {
    return { data: null, error: "Insufficient permissions to void orders." };
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update({
      status: "voided",
      voided_by: user.id,
      voided_at: new Date().toISOString(),
      void_reason: reason.trim(),
    })
    .eq("id", orderId);

  if (updateError) throw new Error(updateError.message);

  const { revalidatePath } = await import("next/cache");
  revalidatePath(`/dashboard/store/${order.store_id}/orders`);
  revalidatePath(`/dashboard/store/${order.store_id}/orders/${orderId}`);
  revalidatePath(`/dashboard/store/${order.store_id}`);
  revalidatePath(`/dashboard/store/${order.store_id}/reports`);

  return { data: { success: true }, error: null };
}

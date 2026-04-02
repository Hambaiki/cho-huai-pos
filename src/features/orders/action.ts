"use server";

import {
  CreateOrderInput,
  CreateOrderResult,
  createOrderSchema,
} from "@/features/orders/validations";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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

  const subtotal = parsed.data.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );

  const discount = parsed.data.items.reduce(
    (sum, item) => sum + item.discount * item.quantity,
    0,
  );

  const total = Math.max(0, subtotal - discount);
  const isBnpl = parsed.data.paymentMethod === "bnpl";

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
      tax_amount: 0,
      total,
      amount_tendered: isBnpl ? null : (parsed.data.amountTendered ?? null),
      change_amount:
        !isBnpl &&
        parsed.data.amountTendered &&
        parsed.data.amountTendered > total
          ? parsed.data.amountTendered - total
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
      total,
      amountTendered: isBnpl ? null : (parsed.data.amountTendered ?? null),
      changeAmount:
        !isBnpl &&
        parsed.data.amountTendered &&
        parsed.data.amountTendered > total
          ? parsed.data.amountTendered - total
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

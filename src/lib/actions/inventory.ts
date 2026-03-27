"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ReceiveStockResult =
  | { data: { lotId: string }; error: null }
  | { data: null; error: string };

export type AdjustStockResult =
  | { data: { adjustmentId: string }; error: null }
  | { data: null; error: string };

const receiveStockSchema = z.object({
  storeId: z.string().uuid(),
  productId: z.string().uuid(),
  quantity: z.number().int().positive("Quantity must be at least 1"),
  unitCost: z.number().min(0, "Unit cost must be 0 or more"),
  sourceRef: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});

const adjustStockSchema = z
  .object({
    storeId: z.string().uuid(),
    productId: z.string().uuid(),
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
        code: z.ZodIssueCode.custom,
        message: "Use return, correction, or initial for stock increases.",
        path: ["reason"],
      });
    }

    if (
      value.direction === "decrease" &&
      !["damage", "loss", "correction"].includes(value.reason)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Use damage, loss, or correction for stock decreases.",
        path: ["reason"],
      });
    }

    if (value.direction === "increase" && value.unitCost == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Unit cost is required when increasing stock.",
        path: ["unitCost"],
      });
    }
  });

function getFirstValidationError(error: z.ZodError): string {
  const firstMessage = Object.values(error.flatten().fieldErrors).flat()[0];
  return typeof firstMessage === "string"
    ? firstMessage
    : "Please check the form fields.";
}

export async function receiveStockAction(
  formData: FormData,
): Promise<ReceiveStockResult> {
  const parsed = receiveStockSchema.safeParse({
    storeId: formData.get("storeId"),
    productId: formData.get("productId"),
    quantity: Number.parseInt(formData.get("quantity") as string, 10),
    unitCost: Number.parseFloat(formData.get("unitCost") as string),
    sourceRef: (formData.get("sourceRef") as string) || undefined,
    notes: (formData.get("notes") as string) || undefined,
  });

  if (!parsed.success) {
    return { data: null, error: getFirstValidationError(parsed.error) };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { data: null, error: "Please sign in again." };

  // Verify user is owner or manager of this store
  const { data: membership } = await supabase
    .from("store_members")
    .select("role")
    .eq("store_id", parsed.data.storeId)
    .eq("user_id", user.id)
    .single();

  if (!membership || !["owner", "manager"].includes(membership.role)) {
    return { data: null, error: "Only owners and managers can receive stock." };
  }

  // Verify the product belongs to this store
  const { data: product } = await supabase
    .from("products")
    .select("id, stock_qty")
    .eq("id", parsed.data.productId)
    .eq("store_id", parsed.data.storeId)
    .single();

  if (!product) {
    return { data: null, error: "Product not found in this store." };
  }

  // Insert purchase lot
  const { data: lot, error: lotError } = await supabase
    .from("purchase_lots")
    .insert({
      store_id: parsed.data.storeId,
      product_id: parsed.data.productId,
      received_qty: parsed.data.quantity,
      remaining_qty: parsed.data.quantity,
      unit_cost: parsed.data.unitCost,
      source_ref: parsed.data.sourceRef ?? null,
      notes: parsed.data.notes ?? null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (lotError || !lot) {
    return { data: null, error: lotError?.message ?? "Failed to create purchase lot." };
  }

  // Also record in stock_adjustments for audit trail (reason = purchase)
  await supabase.from("stock_adjustments").insert({
    store_id: parsed.data.storeId,
    product_id: parsed.data.productId,
    adjusted_by: user.id,
    quantity: parsed.data.quantity,
    reason: "purchase",
    notes: parsed.data.sourceRef
      ? `Lot ${lot.id} — ref: ${parsed.data.sourceRef}`
      : `Lot ${lot.id}`,
  });

  // Increment product stock_qty
  const { error: stockError } = await supabase
    .from("products")
    .update({
      stock_qty: product.stock_qty + parsed.data.quantity,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.productId);

  if (stockError) {
    // Lot is already committed; log but don't fail the user action
    console.error("Failed to sync product stock_qty after lot insert", stockError);
  }

  revalidatePath(`/dashboard/store/${parsed.data.storeId}/inventory`);
  revalidatePath(`/dashboard/store/${parsed.data.storeId}/inventory/${parsed.data.productId}`);

  return { data: { lotId: lot.id }, error: null };
}

export async function adjustStockAction(
  formData: FormData,
): Promise<AdjustStockResult> {
  const parsed = adjustStockSchema.safeParse({
    storeId: formData.get("storeId"),
    productId: formData.get("productId"),
    direction: formData.get("direction"),
    reason: formData.get("reason"),
    quantity: Number.parseInt(formData.get("quantity") as string, 10),
    unitCost: formData.get("unitCost")
      ? Number.parseFloat(formData.get("unitCost") as string)
      : undefined,
    notes: (formData.get("notes") as string) || undefined,
  });

  if (!parsed.success) {
    return { data: null, error: getFirstValidationError(parsed.error) };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Please sign in again." };
  }

  const { data: membership } = await supabase
    .from("store_members")
    .select("role")
    .eq("store_id", parsed.data.storeId)
    .eq("user_id", user.id)
    .single();

  if (!membership || !["owner", "manager"].includes(membership.role)) {
    return { data: null, error: "Only owners and managers can adjust stock." };
  }

  const [{ data: product }, { data: store }] = await Promise.all([
    supabase
      .from("products")
      .select("id, stock_qty")
      .eq("id", parsed.data.productId)
      .eq("store_id", parsed.data.storeId)
      .single(),
    supabase
      .from("stores")
      .select("cost_method")
      .eq("id", parsed.data.storeId)
      .single(),
  ]);

  if (!product) {
    return { data: null, error: "Product not found in this store." };
  }

  const revalidateInventory = () => {
    revalidatePath(`/dashboard/store/${parsed.data.storeId}/inventory`);
    revalidatePath(
      `/dashboard/store/${parsed.data.storeId}/inventory/${parsed.data.productId}`,
    );
  };

  if (parsed.data.direction === "increase") {
    const { data: lot, error: lotError } = await supabase
      .from("purchase_lots")
      .insert({
        store_id: parsed.data.storeId,
        product_id: parsed.data.productId,
        received_qty: parsed.data.quantity,
        remaining_qty: parsed.data.quantity,
        unit_cost: parsed.data.unitCost ?? 0,
        source_ref: `adjustment:${parsed.data.reason}`,
        notes: parsed.data.notes ?? null,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (lotError || !lot) {
      return {
        data: null,
        error: lotError?.message ?? "Failed to create the adjustment lot.",
      };
    }

    const { error: productError } = await supabase
      .from("products")
      .update({
        stock_qty: product.stock_qty + parsed.data.quantity,
        updated_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.productId);

    if (productError) {
      await supabase.from("purchase_lots").delete().eq("id", lot.id);
      return { data: null, error: productError.message };
    }

    const { data: adjustment, error: adjustmentError } = await supabase
      .from("stock_adjustments")
      .insert({
        store_id: parsed.data.storeId,
        product_id: parsed.data.productId,
        adjusted_by: user.id,
        quantity: parsed.data.quantity,
        reason: parsed.data.reason,
        notes: parsed.data.notes ?? null,
      })
      .select("id")
      .single();

    if (adjustmentError || !adjustment) {
      await supabase
        .from("products")
        .update({
          stock_qty: product.stock_qty,
          updated_at: new Date().toISOString(),
        })
        .eq("id", parsed.data.productId);
      await supabase.from("purchase_lots").delete().eq("id", lot.id);
      return {
        data: null,
        error:
          adjustmentError?.message ?? "Failed to record the stock adjustment.",
      };
    }

    revalidateInventory();
    return { data: { adjustmentId: adjustment.id }, error: null };
  }

  if (product.stock_qty < parsed.data.quantity) {
    return { data: null, error: "Cannot decrease stock below zero." };
  }

  const useFifo = (store?.cost_method ?? "fifo") === "fifo";
  const { data: lots, error: lotsError } = await supabase
    .from("purchase_lots")
    .select("id, remaining_qty")
    .eq("store_id", parsed.data.storeId)
    .eq("product_id", parsed.data.productId)
    .gt("remaining_qty", 0)
    .order("received_at", { ascending: useFifo });

  if (lotsError) {
    return { data: null, error: lotsError.message };
  }

  let remaining = parsed.data.quantity;
  const updates: Array<{ id: string; before: number; after: number }> = [];

  for (const lot of lots ?? []) {
    if (remaining === 0) break;
    const consumed = Math.min(lot.remaining_qty, remaining);
    updates.push({
      id: lot.id,
      before: lot.remaining_qty,
      after: lot.remaining_qty - consumed,
    });
    remaining -= consumed;
  }

  if (remaining > 0) {
    return {
      data: null,
      error: "Lot balances are too low to complete this stock decrease.",
    };
  }

  const { error: productError } = await supabase
    .from("products")
    .update({
      stock_qty: product.stock_qty - parsed.data.quantity,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.productId);

  if (productError) {
    return { data: null, error: productError.message };
  }

  const applied: Array<{ id: string; before: number }> = [];

  for (const update of updates) {
    const { error: lotUpdateError } = await supabase
      .from("purchase_lots")
      .update({ remaining_qty: update.after })
      .eq("id", update.id);

    if (lotUpdateError) {
      for (const rollback of applied) {
        await supabase
          .from("purchase_lots")
          .update({ remaining_qty: rollback.before })
          .eq("id", rollback.id);
      }
      await supabase
        .from("products")
        .update({
          stock_qty: product.stock_qty,
          updated_at: new Date().toISOString(),
        })
        .eq("id", parsed.data.productId);
      return { data: null, error: lotUpdateError.message };
    }

    applied.push({ id: update.id, before: update.before });
  }

  const { data: adjustment, error: adjustmentError } = await supabase
    .from("stock_adjustments")
    .insert({
      store_id: parsed.data.storeId,
      product_id: parsed.data.productId,
      adjusted_by: user.id,
      quantity: -parsed.data.quantity,
      reason: parsed.data.reason,
      notes: parsed.data.notes ?? null,
    })
    .select("id")
    .single();

  if (adjustmentError || !adjustment) {
    for (const rollback of applied) {
      await supabase
        .from("purchase_lots")
        .update({ remaining_qty: rollback.before })
        .eq("id", rollback.id);
    }
    await supabase
      .from("products")
      .update({
        stock_qty: product.stock_qty,
        updated_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.productId);
    return {
      data: null,
      error: adjustmentError?.message ?? "Failed to record the stock adjustment.",
    };
  }

  revalidateInventory();
  return { data: { adjustmentId: adjustment.id }, error: null };
}

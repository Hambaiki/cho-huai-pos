"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { productFormSchema } from "@/lib/validations/product";

export interface ProductActionResult {
  data: { productId: string } | null;
  error: string | null;
}

export async function createProductAction(
  storeId: string,
  input: z.infer<typeof productFormSchema>,
): Promise<ProductActionResult> {
  const parsed = productFormSchema.safeParse(input);

  if (!parsed.success) {
    return { data: null, error: "Please check product details and try again." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Please sign in again." };
  }

  // Verify user is manager+ in this store
  const { data: membership } = await supabase
    .from("store_members")
    .select("role")
    .eq("store_id", storeId)
    .eq("user_id", user.id)
    .single();

  if (!membership || !["owner", "manager"].includes(membership.role)) {
    return { data: null, error: "You do not have permission to create products." };
  }

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      store_id: storeId,
      category_id: parsed.data.categoryId || null,
      name: parsed.data.name,
      sku: parsed.data.sku || null,
      barcode: parsed.data.barcode || null,
      price: parsed.data.price,
      cost_price: parsed.data.costPrice || null,
      stock_qty: parsed.data.stockQty,
      low_stock_at: parsed.data.lowStockAt,
      unit: parsed.data.unit,
    })
    .select("id")
    .single();

  if (error || !product) {
    return { data: null, error: error?.message ?? "Failed to create product." };
  }

  return { data: { productId: product.id }, error: null };
}

export async function updateProductAction(
  productId: string,
  input: z.infer<typeof productFormSchema>,
): Promise<ProductActionResult> {
  const parsed = productFormSchema.safeParse(input);

  if (!parsed.success) {
    return { data: null, error: "Please check product details and try again." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Please sign in again." };
  }

  // Verify product exists and user has permission
  const { data: product } = await supabase
    .from("products")
    .select("store_id")
    .eq("id", productId)
    .single();

  if (!product) {
    return { data: null, error: "Product not found." };
  }

  const { data: membership } = await supabase
    .from("store_members")
    .select("role")
    .eq("store_id", product.store_id)
    .eq("user_id", user.id)
    .single();

  if (!membership || !["owner", "manager"].includes(membership.role)) {
    return { data: null, error: "You do not have permission to edit this product." };
  }

  const { error } = await supabase
    .from("products")
    .update({
      category_id: parsed.data.categoryId || null,
      name: parsed.data.name,
      sku: parsed.data.sku || null,
      barcode: parsed.data.barcode || null,
      price: parsed.data.price,
      cost_price: parsed.data.costPrice || null,
      stock_qty: parsed.data.stockQty,
      low_stock_at: parsed.data.lowStockAt,
      unit: parsed.data.unit,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: { productId }, error: null };
}

export async function deleteProductAction(productId: string): Promise<{
  error: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Please sign in again." };
  }

  // Verify product exists and user has permission
  const { data: product } = await supabase
    .from("products")
    .select("store_id")
    .eq("id", productId)
    .single();

  if (!product) {
    return { error: "Product not found." };
  }

  const { data: membership } = await supabase
    .from("store_members")
    .select("role")
    .eq("store_id", product.store_id)
    .eq("user_id", user.id)
    .single();

  if (!membership || !["owner", "manager"].includes(membership.role)) {
    return { error: "You do not have permission to delete this product." };
  }

  const { error } = await supabase.from("products").delete().eq("id", productId);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

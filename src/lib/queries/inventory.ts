import { createClient } from "@/lib/supabase/server";

import type { Tables } from "@/lib/supabase/types";

type PaginatedProductRow = Pick<
  Tables<"products">,
  | "id"
  | "name"
  | "sku"
  | "barcode"
  | "price"
  | "cost_price"
  | "stock_qty"
  | "low_stock_at"
  | "unit"
  | "is_active"
  | "category_id"
  | "image_url"
> & {
  category_name: string | null;
  total_count: number;
};

export async function getInventoryListData({
  storeId,
  query,
  statuses,
  stockStatuses,
  categoryIds,
  page,
  pageSize,
}: {
  storeId: string;
  query: string;
  statuses: string[];
  stockStatuses: string[];
  categoryIds: string[];
  page: number;
  pageSize: number;
}) {
  const supabase = await createClient();

  const [{ data: productsData, error }, { data: categoriesData }] =
    await Promise.all([
      supabase.rpc("paginated_products", {
        p_store_id: storeId,
        p_query: query || undefined,
        p_statuses: statuses.length > 0 ? statuses : undefined,
        p_stock_statuses: stockStatuses.length > 0 ? stockStatuses : undefined,
        p_category_ids: categoryIds,
        p_page: page,
        p_page_size: pageSize,
      }),
      supabase
        .from("categories")
        .select("id, name")
        .eq("store_id", storeId)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),
    ]);

  const productRows = (productsData ?? []) as PaginatedProductRow[];
  const totalItems = productRows[0]?.total_count ?? 0;

  return {
    error,
    products: productRows.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      barcode: p.barcode,
      imageUrl: p.image_url,
      price: p.price,
      costPrice: p.cost_price,
      stockQty: p.stock_qty,
      lowStockAt: p.low_stock_at,
      unit: p.unit,
      isActive: p.is_active,
      categoryId: p.category_id,
      categoryName: p.category_name,
    })),
    categoryOptions: (categoriesData ?? []).map((c) => ({
      value: c.id,
      label: c.name,
    })),
    totalItems,
  };
}

export async function getInventoryDetailData({
  userId,
  storeId,
  productId,
}: {
  userId: string;
  storeId: string;
  productId: string;
}) {
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("store_members")
    .select("role")
    .eq("store_id", storeId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!membership) return null;

  const [
    { data: product },
    { data: lots },
    { data: categories },
    { data: adjustments },
  ] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, name, sku, barcode, price, cost_price, stock_qty, low_stock_at, unit, is_active, category_id, image_url, updated_at, created_at, categories(name)",
      )
      .eq("id", productId)
      .eq("store_id", storeId)
      .maybeSingle(),
    supabase
      .from("purchase_lots")
      .select(
        "id, received_qty, remaining_qty, unit_cost, source_ref, notes, received_at",
      )
      .eq("product_id", productId)
      .eq("store_id", storeId)
      .order("received_at", { ascending: false })
      .limit(50),
    supabase
      .from("categories")
      .select("id, name")
      .eq("store_id", storeId)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("stock_adjustments")
      .select("id, quantity, reason, notes, created_at")
      .eq("product_id", productId)
      .eq("store_id", storeId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const canManage = ["owner", "manager"].includes(membership.role);

  return {
    canManage,
    product: product
      ? {
          id: product.id,
          name: product.name,
          sku: product.sku,
          barcode: product.barcode,
          price: product.price,
          costPrice: product.cost_price,
          stockQty: product.stock_qty,
          lowStockAt: product.low_stock_at,
          unit: product.unit,
          isActive: product.is_active,
          categoryId: product.category_id,
          categoryName:
            (product.categories as { name: string } | null)?.name ?? null,
          imageUrl: product.image_url,
          updatedAt: product.updated_at,
          createdAt: product.created_at,
        }
      : null,
    categories: (categories ?? []).map((c) => ({
      value: c.id,
      label: c.name,
    })),
    lots: (lots ?? []).map((l) => ({
      id: l.id,
      receivedQty: l.received_qty,
      remainingQty: l.remaining_qty,
      unitCost: l.unit_cost,
      sourceRef: l.source_ref,
      notes: l.notes,
      receivedAt: l.received_at,
    })),
    adjustments: (adjustments ?? []).map((a) => ({
      id: a.id,
      quantity: a.quantity,
      reason: a.reason,
      notes: a.notes,
      createdAt: a.created_at,
    })),
  };
}

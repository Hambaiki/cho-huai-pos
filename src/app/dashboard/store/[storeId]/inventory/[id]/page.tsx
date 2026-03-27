import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InventoryDetailClient } from "@/components/inventory/InventoryDetailClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ storeId: string; id: string }>;
}) {
  const { id, storeId } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("name")
    .eq("id", id)
    .eq("store_id", storeId)
    .single();
  return { title: data?.name ?? "Product Detail" };
}

export default async function InventoryDetailPage({
  params,
}: {
  params: Promise<{ storeId: string; id: string }>;
}) {
  const { storeId, id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("store_members")
    .select("role")
    .eq("store_id", storeId)
    .eq("user_id", user.id)
    .single();

  if (!membership) redirect("/dashboard");

  // Fetch product details
  const { data: product } = await supabase
    .from("products")
    .select(
      "id, name, sku, barcode, price, cost_price, stock_qty, low_stock_at, unit, is_active, category_id, image_url, updated_at, created_at, categories(name)",
    )
    .eq("id", id)
    .eq("store_id", storeId)
    .single();

  if (!product) notFound();

  // Fetch purchase lots for this product (most recent first)
  const { data: lots } = await supabase
    .from("purchase_lots")
    .select(
      "id, received_qty, remaining_qty, unit_cost, source_ref, notes, received_at",
    )
    .eq("product_id", id)
    .eq("store_id", storeId)
    .order("received_at", { ascending: false })
    .limit(50);

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("store_id", storeId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  // Fetch recent stock adjustments
  const { data: adjustments } = await supabase
    .from("stock_adjustments")
    .select("id, quantity, reason, notes, created_at")
    .eq("product_id", id)
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .limit(20);

  const canManage = ["owner", "manager"].includes(membership.role);

  return (
    <div className="space-y-6">
      <InventoryDetailClient
        storeId={storeId}
        product={{
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
            (product.categories as unknown as { name: string } | null)?.name ??
            null,
          imageUrl: product.image_url,
          updatedAt: product.updated_at,
          createdAt: product.created_at,
        }}
        categories={
          categories?.map((category) => ({
            value: category.id,
            label: category.name,
          })) ?? []
        }
        lots={
          lots?.map((l) => ({
            id: l.id,
            receivedQty: l.received_qty,
            remainingQty: l.remaining_qty,
            unitCost: l.unit_cost,
            sourceRef: l.source_ref,
            notes: l.notes,
            receivedAt: l.received_at,
          })) ?? []
        }
        adjustments={
          adjustments?.map((a) => ({
            id: a.id,
            quantity: a.quantity,
            reason: a.reason,
            notes: a.notes,
            createdAt: a.created_at,
          })) ?? []
        }
        canManage={canManage}
      />
    </div>
  );
}

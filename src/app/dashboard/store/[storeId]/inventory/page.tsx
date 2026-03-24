import { createClient } from "@/lib/supabase/server";
import { InventoryContent } from "@/components/inventory/InventoryContent";

export const metadata = {
  title: "Inventory - CHO-HUAI POS",
};

export default async function InventoryPage() {
  const supabase = await createClient();

  const { data: products, error } = await supabase
    .from("products")
    .select(
      "id, name, sku, barcode, price, cost_price, stock_qty, low_stock_at, unit, is_active",
    )
    .order("name", { ascending: true });

  if (error) {
    return (
      <section className="rounded-lg border border-danger-200 bg-danger-50 p-6">
        <h2 className="text-lg font-semibold text-danger-900">Error loading products</h2>
        <p className="mt-2 text-sm text-danger-700">{error.message}</p>
      </section>
    );
  }

  const mappedProducts = products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    barcode: p.barcode,
    price: p.price,
    costPrice: p.cost_price,
    stockQty: p.stock_qty,
    lowStockAt: p.low_stock_at,
    unit: p.unit,
    isActive: p.is_active,
  }));

  return (
    <section className="space-y-6">
      <InventoryContent products={mappedProducts} />
    </section>
  );
}

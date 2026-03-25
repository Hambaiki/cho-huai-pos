import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/inventory/ProductForm";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata = {
  title: "Edit Product - CHO-HUAI POS",
};

interface EditProductPageProps {
  params: Promise<{
    id: string;
    storeId: string;
  }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id, storeId } = await params;
  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from("products")
    .select("id, name, sku, barcode, image_url, price, cost_price, stock_qty, low_stock_at, unit, category_id")
    .eq("id", id)
    .single();

  if (error || !product) {
    redirect(`/dashboard/store/${storeId}/inventory`);
  }

  const { data: categoriesData } = await supabase
    .from("categories")
    .select("id, name")
    .eq("store_id", storeId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  const categories = (categoriesData ?? []).map((category) => ({
    value: category.id,
    label: category.name,
  }));

  return (
    <section className="space-y-6">
      <PageHeader title="Edit Product" description={product.name} />
      <ProductForm
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
          categoryId: product.category_id,
          imageUrl: product.image_url,
        }}
        categories={categories}
      />
    </section>
  );
}

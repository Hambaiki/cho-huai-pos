import { ProductForm } from "@/components/inventory/ProductForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "New Product - CHO-HUAI POS",
};

export default async function NewProductPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const supabase = await createClient();

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
      <PageHeader
        title="Add New Product"
        description="Create a new product for your store inventory"
      />
      <ProductForm categories={categories} />
    </section>
  );
}

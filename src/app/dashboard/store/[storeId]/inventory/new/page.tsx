import { ProductForm } from "@/components/inventory/ProductForm";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata = {
  title: "New Product - CHO-HUAI POS",
};

export default function NewProductPage() {
  return (
    <section className="space-y-6">
      <PageHeader
        title="Add New Product"
        description="Create a new product for your store inventory"
      />
      <ProductForm />
    </section>
  );
}

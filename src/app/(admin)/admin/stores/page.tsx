import { PageHeader } from "@/components/content/PageHeader";
import { AdminStoresTable } from "@/features/admin/components/AdminStoresTable";
import { getAllStores } from "@/features/admin/queries";
import { getCurrentUser } from "@/features/auth/queries";
import { redirect } from "next/navigation";

export const metadata = { title: "All Stores — Admin" };

export default async function AdminStoresPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const stores = await getAllStores();

  return (
    <section className="space-y-6">
      <PageHeader
        title="All Stores"
        description="Store directory and metadata"
      />

      <AdminStoresTable stores={stores} />
    </section>
  );
}

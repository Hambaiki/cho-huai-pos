import { redirect } from "next/navigation";
import { AdminStoresTable } from "@/components/admin/AdminStoresTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCurrentUser } from "@/lib/queries/auth";
import { getAllStores } from "@/lib/queries/admin";

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

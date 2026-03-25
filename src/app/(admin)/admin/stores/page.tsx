import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminStoresTable } from "@/components/admin/AdminStoresTable";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata = { title: "All Stores — Admin" };

export default async function AdminStoresPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: stores } = await supabase
    .from("stores")
    .select("id, name, currency_code, is_suspended, created_at")
    .order("created_at", { ascending: false });

  return (
    <section className="space-y-6">
      <PageHeader title="All Stores" description="Store directory and metadata" />

      <AdminStoresTable stores={stores ?? []} />
    </section>
  );
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminUsersTable } from "@/components/admin/AdminUsersTable";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata = { title: "All Users — Admin" };

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, is_super_admin, is_suspended, created_at")
    .order("created_at", { ascending: false });

  return (
    <section className="space-y-6">
      <PageHeader title="All Users" description="User directory across all stores" />

      <AdminUsersTable profiles={profiles ?? []} currentUserId={user.id} />
    </section>
  );
}

import { redirect } from "next/navigation";
import { AdminUsersTable } from "@/components/admin/AdminUsersTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCurrentUser } from "@/lib/queries/auth";
import { getAllUserProfiles } from "@/lib/queries/admin";

export const metadata = { title: "All Users — Admin" };

export default async function AdminUsersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profiles = await getAllUserProfiles();

  return (
    <section className="space-y-6">
      <PageHeader
        title="All Users"
        description="User directory across all stores"
      />

      <AdminUsersTable profiles={profiles} currentUserId={user.id} />
    </section>
  );
}

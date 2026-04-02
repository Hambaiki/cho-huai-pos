import { PageHeader } from "@/components/content/PageHeader";
import { AdminUsersTable } from "@/features/admin/components/AdminUsersTable";
import { getAllUserProfiles } from "@/features/admin/queries";
import { getCurrentUser } from "@/features/auth/queries";
import { redirect } from "next/navigation";

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

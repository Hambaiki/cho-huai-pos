import { PageHeader } from "@/components/content/PageHeader";
import { getCurrentUser } from "@/features/auth/queries";
import { StaffManagement } from "@/features/settings/components/StaffManagement";
import { getTeamPageData } from "@/features/settings/queries";
import { redirect } from "next/navigation";

export const metadata = { title: "Team" };

export default async function TeamPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const data = await getTeamPageData({ userId: user.id, storeId });
  if (!data) redirect("/dashboard");

  return (
    <section className="space-y-6">
      <PageHeader title="Team" description="Manage staff members and access" />

      <StaffManagement
        storeId={storeId}
        staffMembers={data.staffMembers}
        role={data.role}
      />
    </section>
  );
}

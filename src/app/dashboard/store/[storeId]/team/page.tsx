import { redirect } from "next/navigation";
import { StaffManagement } from "@/components/settings/StaffManagement";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCurrentUser } from "@/lib/queries/auth";
import { getTeamPageData } from "@/lib/queries/settings";

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

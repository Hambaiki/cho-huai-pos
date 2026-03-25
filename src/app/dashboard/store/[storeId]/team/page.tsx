import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StaffManagement } from "@/components/settings/StaffManagement";
import { getStaffMembers } from "@/lib/actions/settingsActions";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata = { title: "Team" };

export default async function TeamPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("store_members")
    .select("store_id, role")
    .eq("user_id", user.id)
    .eq("store_id", storeId)
    .single();

  if (!membership?.store_id) redirect("/dashboard");

  const staffMembers = await getStaffMembers(storeId);

  return (
    <section className="space-y-6">
      <PageHeader title="Team" description="Manage staff members and access" />

      <StaffManagement
        storeId={storeId}
        staffMembers={staffMembers}
        role={membership.role as "owner" | "manager" | "cashier" | "viewer"}
      />
    </section>
  );
}

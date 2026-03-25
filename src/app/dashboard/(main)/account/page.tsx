import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AccountSettingsClient from "@/components/settings/AccountSettingsClient";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata = {
  title: "Account Settings",
};

export default async function DashboardAccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, created_at")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Account Settings"
        description="Update your personal account profile used across your workspaces."
      />

      <AccountSettingsClient
        email={user.email ?? ""}
        displayName={profile?.display_name ?? ""}
        createdAt={new Date(
          profile?.created_at ?? user.created_at,
        ).toLocaleDateString()}
      />
    </div>
  );
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardSidebarLayout } from "@/components/layout/DashboardSidebarLayout";
import AccountSettingsClient from "@/components/settings/AccountSettingsClient";

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
    <DashboardSidebarLayout>
      <AccountSettingsClient
        email={user.email ?? ""}
        displayName={profile?.display_name ?? ""}
        createdAt={new Date(profile?.created_at ?? user.created_at).toLocaleDateString()}
      />
    </DashboardSidebarLayout>
  );
}

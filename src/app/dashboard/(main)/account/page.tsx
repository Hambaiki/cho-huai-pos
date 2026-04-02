import { PageHeader } from "@/components/content/PageHeader";
import {
  getCurrentUser,
  getUserProfileForSettings,
} from "@/features/auth/queries";
import AccountSettingsClient from "@/features/settings/components/AccountSettingsClient";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Account Settings",
};

export default async function DashboardAccountPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const profile = await getUserProfileForSettings(user.id);

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

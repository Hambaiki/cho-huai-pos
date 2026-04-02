import { PageHeader } from "@/components/content/PageHeader";
import {
  getCurrentUserProfile,
  getSitewideSettings,
} from "@/features/admin/actions";
import { SitewideSettingsForm } from "@/features/admin/components/SitewideSettingsForm";
import { redirect } from "next/navigation";

export const metadata = { title: "Sitewide Settings — Admin" };

export default async function AdminSettingsPage() {
  const { profile } = await getCurrentUserProfile();

  if (!profile.is_super_admin) {
    redirect("/dashboard");
  }

  const settings = await getSitewideSettings();

  return (
    <section className="space-y-6">
      <PageHeader
        title="Sitewide Settings"
        description="Configure system-wide settings including maintenance mode and announcements"
      />

      <div className="rounded-lg border border-border bg-surface">
        <SitewideSettingsForm
          maintenanceMode={settings.maintenanceMode}
          announcementText={settings.announcementText}
        />
      </div>
    </section>
  );
}

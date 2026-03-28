import { redirect } from "next/navigation";
import { SitewideSettingsForm } from "@/components/admin/SitewideSettingsForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { getSitewideSettings, getCurrentUserProfile } from "@/lib/actions/admin";

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

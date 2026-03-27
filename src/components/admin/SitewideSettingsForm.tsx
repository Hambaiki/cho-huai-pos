"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateSitewideSettingsAction } from "@/lib/actions/admin";
import { FormTextarea } from "@/components/ui/form/FormTextarea";
import { FormLabel } from "@/components/ui/form/FormLabel";
import { FormHelp } from "@/components/ui/form/FormHelp";
import { Button } from "@/components/ui/Button";
import { AlertCircle } from "lucide-react";
import { useSyncPendingAction } from "../ui/PendingActionProvider";
import { FormToggle } from "../ui/form";

interface SitewideSettingsFormProps {
  maintenanceMode: boolean;
  announcementText: string;
}

export function SitewideSettingsForm({
  maintenanceMode: initialMaintenanceMode,
  announcementText: initialAnnouncementText,
}: SitewideSettingsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [maintenanceMode, setMaintenanceMode] = useState(
    initialMaintenanceMode,
  );
  const [announcementText, setAnnouncementText] = useState(
    initialAnnouncementText,
  );

  useSyncPendingAction(isPending, {
    message: "Saving settings...",
    subMessage:
      "This may take a moment. Please do not close or refresh the page.",
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.set("maintenanceMode", String(maintenanceMode));
    formData.set("announcementText", announcementText);

    startTransition(async () => {
      const result = await updateSitewideSettingsAction(formData);

      if (!result.ok) {
        setError(result.error ?? "Unable to save settings.");
        return;
      }

      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="mb-6 rounded-md bg-danger-50 border border-danger-200 p-4 flex gap-3">
          <AlertCircle size={20} className="text-danger-600 shrink-0 mt-1" />
          <p className="text-sm font-medium text-danger-900">{error}</p>
        </div>
      )}

      <div className="divide-y divide-border">
        {/* Maintenance Mode */}
        <div className="p-4 flex items-start justify-between gap-8">
          <div className="space-y-1">
            <FormLabel htmlFor="maintenance_mode">Maintenance Mode</FormLabel>
            <FormHelp>
              When enabled, only super admins can access the application. All
              other users will see a maintenance page.
            </FormHelp>
          </div>
          <FormToggle
            id="maintenance_mode"
            name="maintenance_mode"
            value={maintenanceMode}
            disabled={isPending}
            onChange={(enabled) => setMaintenanceMode(enabled)}
          />
        </div>

        {/* Announcement Banner */}
        <div className="p-4 space-y-3">
          <div className="space-y-1">
            <FormLabel htmlFor="announcement_text">
              Announcement Banner
            </FormLabel>
            <FormHelp>
              Display an announcement banner to all users. Leave empty to hide
              the banner. Maximum 1000 characters.
            </FormHelp>
          </div>
          <FormTextarea
            id="announcement_text"
            name="announcement_text"
            value={announcementText}
            onChange={(e) => setAnnouncementText(e.target.value)}
            disabled={isPending}
            placeholder="Enter announcement text or leave empty to hide..."
            rows={4}
            maxLength={1000}
          />
          <p className="text-xs text-neutral-500 text-right">
            {announcementText.length} / 1000 characters
          </p>
        </div>
      </div>

      <div className="flex justify-end p-4">
        <Button type="submit" disabled={isPending} isLoading={isPending}>
          Save Settings
        </Button>
      </div>
    </form>
  );
}

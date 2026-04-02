// Utility functions for sitewide settings

export interface SitewideSettings {
  maintenanceMode: boolean;
  announcementText: string;
}

/**
 * Get sitewide settings from the context or API
 * Use this in server components
 */
export async function fetchSitewideSettings(): Promise<SitewideSettings> {
  try {
    // This will be called from server components
    // Import here to avoid circular dependencies
    const { getSitewideSettings } = await import("@/features/admin/actions");
    return await getSitewideSettings();
  } catch {
    // Default to safe values if fetch fails
    return {
      maintenanceMode: false,
      announcementText: "",
    };
  }
}

/**
 * Check if maintenance mode is active
 * Use in proxy or server components
 */
export async function isMaintenanceModeActive(): Promise<boolean> {
  const settings = await fetchSitewideSettings();
  return settings.maintenanceMode;
}

/**
 * Get announcement text if available
 * Use in layouts or announcement components
 */
export async function getAnnouncementText(): Promise<string> {
  const settings = await fetchSitewideSettings();
  return settings.announcementText;
}

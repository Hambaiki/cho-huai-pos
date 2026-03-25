import { getAnnouncementText } from "@/lib/utils/sitewide-settings";
import { AnnouncementBanner } from "./AnnouncementBanner";

/**
 * Server component that fetches and displays announcement banner
 * Use in root layout or main app layouts
 */
export async function ServerAnnouncementBanner() {
  const announcementText = await getAnnouncementText();

  if (!announcementText) {
    return null;
  }

  return <AnnouncementBanner text={announcementText} closable={true} />;
}

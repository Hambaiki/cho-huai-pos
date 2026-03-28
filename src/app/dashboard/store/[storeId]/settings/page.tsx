import { redirect } from "next/navigation";
import SettingsClient from "@/components/settings/SettingsClient";
import { getCurrentUser } from "@/lib/queries/auth";
import { getSettingsPageData } from "@/lib/queries/settings";

export const metadata = {
  title: "Settings",
};

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const data = await getSettingsPageData({ userId: user.id, storeId });
  if (!data) redirect("/dashboard");

  return (
    <SettingsClient
      qrChannels={data.qrChannels}
      categories={data.categories}
      storeId={storeId}
      role={data.role}
      store={data.store}
    />
  );
}


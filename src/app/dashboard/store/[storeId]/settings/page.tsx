import { getCurrentUser } from "@/features/auth/queries";
import SettingsClient from "@/features/settings/components/SettingsClient";
import { getSettingsPageData } from "@/features/settings/queries";
import { redirect } from "next/navigation";

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

import { getCurrentUser } from "@/features/auth/queries";
import { getUserStoresMemberships } from "@/features/dashboard/queries";
import { StoresHubClient } from "@/features/stores/components/StoresHubClient";
import { redirect } from "next/navigation";

export const metadata = { title: "Your Stores" };

export default async function DashboardStoresPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const memberships = await getUserStoresMemberships(user.id);

  const stores = (memberships || [])
    .map((row) => {
      if (!row.stores) return null;
      return {
        id: row.stores.id,
        name: row.stores.name,
        address: row.stores.address,
        isSuspended: row.stores.is_suspended,
        createdAt: row.stores.created_at,
        role: row.role,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort((a, b) => a.name.localeCompare(b.name));

  return <StoresHubClient stores={stores} />;
}

import { StoresHubPage } from "@/components/stores/StoresHubPage";
import { DashboardSidebarLayout } from "@/components/layout/DashboardSidebarLayout";

export const metadata = { title: "Your Stores" };

export default async function DashboardStoresPage() {
  return (
    <DashboardSidebarLayout>
      <StoresHubPage />
    </DashboardSidebarLayout>
  );
}

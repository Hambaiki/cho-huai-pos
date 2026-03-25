import { DashboardSidebarLayout } from "@/components/layout/DashboardSidebarLayout";

export default async function StoreScopedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardSidebarLayout>{children}</DashboardSidebarLayout>;
}

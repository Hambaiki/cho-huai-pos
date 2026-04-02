import { DashboardSidebarLayout } from "@/components/layout/DashboardSidebarLayout";
import { getCurrentUserAdminStatus } from "@/features/auth/queries";
import { redirect } from "next/navigation";

export default async function StoreScopedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isSuperAdmin } = await getCurrentUserAdminStatus();
  if (!user) {
    redirect("/login");
  }

  return (
    <DashboardSidebarLayout isSuperAdmin={isSuperAdmin}>
      {children}
    </DashboardSidebarLayout>
  );
}

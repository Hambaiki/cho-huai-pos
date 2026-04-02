import { AdminSidebarLayout } from "@/components/layout/AdminSidebarLayout";
import { requireSuperAdminUser } from "@/features/auth/queries";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireSuperAdminUser();
  } catch {
    redirect("/dashboard");
  }

  return <AdminSidebarLayout>{children}</AdminSidebarLayout>;
}

import { redirect } from "next/navigation";
import { AdminSidebarLayout } from "@/components/layout/AdminSidebarLayout";
import { requireSuperAdminUser } from "@/lib/queries/auth";

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

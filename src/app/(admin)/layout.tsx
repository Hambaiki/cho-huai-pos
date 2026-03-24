import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebarLayout } from "@/components/layout/AdminSidebarLayout";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Middleware already checks is_super_admin; this is a fallback for direct renders
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_super_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_super_admin) redirect("/dashboard");

  return <AdminSidebarLayout>{children}</AdminSidebarLayout>;
}

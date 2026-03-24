import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata = { title: "Admin Dashboard" };

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [
    { count: storeCount },
    { count: userCount },
    { count: orderCount },
  ] = await Promise.all([
    supabase.from("stores").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed"),
  ]);

  return (
    <section className="space-y-6">
      <PageHeader title="Admin Dashboard" description="System-wide overview" />

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Stores", value: storeCount ?? 0 },
          { label: "Total Users", value: userCount ?? 0 },
          { label: "Completed Orders", value: orderCount ?? 0 },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-border bg-surface px-5 py-4"
          >
            <p className="text-xs font-semibold uppercase text-neutral-500">{card.label}</p>
            <p className="mt-1 text-3xl font-bold text-neutral-900">{card.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

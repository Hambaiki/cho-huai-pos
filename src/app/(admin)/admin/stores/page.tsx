import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata = { title: "All Stores — Admin" };

export default async function AdminStoresPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: stores } = await supabase
    .from("stores")
    .select("id, name, currency_code, created_at")
    .order("created_at", { ascending: false });

  return (
    <section className="space-y-6">
      <PageHeader title="All Stores" description="Store directory and metadata" />

      <TableContainer className="overflow-hidden">
        <Table>
          <TableHeader className="text-xs text-neutral-500 uppercase">
            <TableRow className="hover:bg-transparent">
              <TableHead>Store Name</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!stores || stores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-neutral-500">
                  No stores yet.
                </TableCell>
              </TableRow>
            ) : (
              stores.map((store) => (
                <TableRow key={store.id} className="border-border">
                  <TableCell className="font-medium text-neutral-900">
                    {store.name}
                  </TableCell>
                  <TableCell className="text-neutral-500">
                    {store.currency_code}
                  </TableCell>
                  <TableCell className="text-neutral-500">
                    {new Date(store.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-neutral-400">
                    {store.id.slice(0, 8)}…
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </section>
  );
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { setUserSuspensionAction } from "@/lib/actions/admin";
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

export const metadata = { title: "All Users — Admin" };

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, is_super_admin, is_suspended, created_at")
    .order("created_at", { ascending: false });

  return (
    <section className="space-y-6">
      <PageHeader title="All Users" description="User directory across all stores" />

      <TableContainer className="overflow-hidden">
        <Table>
          <TableHeader className="text-xs text-neutral-500 uppercase">
            <TableRow className="hover:bg-transparent">
              <TableHead>Display Name</TableHead>
              <TableHead>Super Admin</TableHead>
              <TableHead>Access</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!profiles || profiles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-neutral-500">
                  No users yet.
                </TableCell>
              </TableRow>
            ) : (
              profiles.map((profile) => (
                <TableRow key={profile.id} className="border-border">
                  <TableCell className="font-medium text-neutral-900">
                    {profile.display_name ?? "—"}
                  </TableCell>
                  <TableCell>
                    {profile.is_super_admin ? (
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-brand-50 text-brand-700 font-medium">
                        Yes
                      </span>
                    ) : (
                      <span className="text-neutral-500">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {profile.is_super_admin ? (
                      <span className="text-neutral-500">Always enabled</span>
                    ) : (
                      <form action={setUserSuspensionAction}>
                        <input type="hidden" name="userId" value={profile.id} />
                        <input
                          type="hidden"
                          name="suspend"
                          value={profile.is_suspended ? "false" : "true"}
                        />
                        <button
                          type="submit"
                          className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                            profile.is_suspended
                              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                              : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                          }`}
                        >
                          {profile.is_suspended ? "Approve access" : "Suspend"}
                        </button>
                      </form>
                    )}
                  </TableCell>
                  <TableCell className="text-neutral-500">
                    {new Date(profile.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-neutral-400">
                    {profile.id.slice(0, 8)}…
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

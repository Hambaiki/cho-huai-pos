import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";

export const metadata = { title: "Access Pending" };

export default async function AccessPendingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data } = await supabase
    .from("profiles")
    .select("is_suspended, is_super_admin")
    .eq("id", user.id)
    .maybeSingle();

  const profile = data as { is_suspended?: boolean; is_super_admin?: boolean } | null;

  if (!profile?.is_suspended || profile?.is_super_admin) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-6 py-12">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <h1 className="text-2xl font-semibold text-amber-900">Access Pending Approval</h1>
        <p className="mt-2 text-sm text-amber-800">
          Your account was created successfully, but it is currently suspended by default.
          Please contact a super admin to approve your access.
        </p>
        <p className="mt-3 text-sm text-amber-800">
          You can sign out now and sign in again after approval.
        </p>

        <form action={signOutAction} className="mt-6">
          <Button
            className="bg-amber-700 hover:bg-amber-800"
            type="submit"
          >
            Sign out
          </Button>
        </form>
      </div>
    </main>
  );
}

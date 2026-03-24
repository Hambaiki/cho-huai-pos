import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(1200px_500px_at_20%_-20%,#0f766e33,transparent),radial-gradient(900px_400px_at_90%_10%,#0369a133,transparent),linear-gradient(180deg,#f6fffd_0%,#f8fafc_100%)]">
      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center gap-10 px-6 py-16 text-center">
        <div className="space-y-4">
          <p className="text-xs font-semibold tracking-[0.22em] text-brand-700">
            CHO-HUAI POS
          </p>
          <h1 className="text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
            Fast checkout for small stores.
            <br />
            Built for real-world daily selling.
          </h1>
          <p className="mx-auto text-base text-slate-600 sm:text-lg">
            A lightweight POS with team access, inventory, and built-in BNPL
            designed for small retail operations.
          </p>
        </div>

        <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
          {user ? (
            <>
              <Link
                className="rounded-xl bg-brand-700 px-5 py-3 text-sm font-medium text-white transition hover:bg-brand-800"
                href="/dashboard"
              >
                Go to my stores
              </Link>
              <Link
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                href="/dashboard"
              >
                Open dashboard
              </Link>
            </>
          ) : (
            <>
              <Link
                className="rounded-xl bg-brand-700 px-5 py-3 text-sm font-medium text-white transition hover:bg-brand-800"
                href="/signup"
              >
                Create owner account
              </Link>
              <Link
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                href="/login"
              >
                Sign in
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

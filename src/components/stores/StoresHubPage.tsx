import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreateStoreForm } from "@/components/stores/CreateStoreForm";

type StoreMembershipRow = {
  role: "owner" | "manager" | "cashier" | "viewer";
  stores: {
    id: string;
    name: string;
    address: string | null;
    created_at: string;
  } | null;
};

export async function StoresHubPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: memberships } = await supabase
    .from("store_members")
    .select("role, stores(id, name, address, created_at)")
    .eq("user_id", user.id)
    .returns<StoreMembershipRow[]>();

  const stores = (memberships || [])
    .map((row) => {
      if (!row.stores) return null;
      return {
        id: row.stores.id,
        name: row.stores.name,
        address: row.stores.address,
        createdAt: row.stores.created_at,
        role: row.role,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort((a, b) => a.name.localeCompare(b.name));

  const defaultStore = stores[0];

  return (
    <main className="mx-auto px-2 py-2 sm:px-4 sm:py-4">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.22em] text-brand-700">
            STORE HUB
          </p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-900">Your stores</h1>
          <p className="mt-2 text-sm text-slate-600">
            Browse stores you can access, then continue into the workspace.
          </p>
        </div>
        <Link
          href={defaultStore ? `/dashboard/store/${defaultStore.id}` : "/dashboard/stores"}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Open first store
        </Link>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">Accessible stores</h2>
          <p className="mt-1 text-sm text-slate-600">
            {stores.length === 0
              ? "You are not a member of any stores yet."
              : `${stores.length} store${stores.length > 1 ? "s" : ""} found.`}
          </p>

          <div className="mt-5 space-y-3">
            {stores.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                Create your first store on this page to get started.
              </div>
            ) : (
              stores.map((store) => (
                <article
                  key={store.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{store.name}</h3>
                      <p className="mt-0.5 text-xs uppercase tracking-wide text-slate-500">
                        Role: {store.role}
                      </p>
                    </div>
                    <p className="text-xs text-slate-500">
                      Created {new Date(store.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {store.address ? (
                    <p className="mt-2 text-sm text-slate-600">{store.address}</p>
                  ) : null}
                  <div className="mt-3">
                    <Link
                      href={`/dashboard/store/${store.id}`}
                      className="text-xs font-medium text-brand-700 hover:text-brand-800"
                    >
                      Open store workspace
                    </Link>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Create new store</h2>
            <p className="mt-1 text-sm text-slate-600">
              Add another store workspace with its own currency defaults.
            </p>
            <div className="mt-4">
              <CreateStoreForm ctaLabel="Create new store" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">Account</h2>
            <p className="mt-1 text-sm text-slate-600">
              Manage your personal profile and account preferences.
            </p>
            <div className="mt-4">
              <Link
                href="/dashboard/account"
                className="inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Open account settings
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

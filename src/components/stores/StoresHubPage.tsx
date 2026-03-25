import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StoresHubClient } from "./StoresHubClient";

type StoreMembershipRow = {
  role: "owner" | "manager" | "cashier" | "viewer";
  stores: {
    id: string;
    name: string;
    address: string | null;
    is_suspended: boolean;
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
    .select("role, stores(id, name, address, is_suspended, created_at)")
    .eq("user_id", user.id)
    .returns<StoreMembershipRow[]>();

  const stores = (memberships || [])
    .map((row) => {
      if (!row.stores) return null;
      return {
        id: row.stores.id,
        name: row.stores.name,
        address: row.stores.address,
        isSuspended: row.stores.is_suspended,
        createdAt: row.stores.created_at,
        role: row.role,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort((a, b) => a.name.localeCompare(b.name));

  return <StoresHubClient stores={stores} />;
}


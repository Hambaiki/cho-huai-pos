import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  StoreProvider,
  type MemberRole,
  type StoreContextValue,
} from "@/lib/store-context";
import { StoreSidebarLayout } from "@/components/layout/StoreSidebarLayout";

type MembershipRow = {
  role: MemberRole;
  stores: {
    id: string;
    name: string;
    is_suspended: boolean;
    currency_code: string;
    currency_symbol: string;
    currency_decimals: number;
    symbol_position: "prefix" | "suffix";
  } | null;
};

export default async function StoreScopedLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membership, error } = await supabase
    .from("store_members")
    .select(
      "role, stores(id, name, is_suspended, currency_code, currency_symbol, currency_decimals, symbol_position)",
    )
    .eq("user_id", user.id)
    .eq("store_id", storeId)
    .single()
    .returns<MembershipRow>();

  if (error || !membership?.stores) {
    redirect("/dashboard");
  }

  if (membership.stores.is_suspended) {
    redirect("/dashboard/stores");
  }

  const contextValue: StoreContextValue = {
    storeId: membership.stores.id,
    storeName: membership.stores.name,
    role: membership.role,
    currency: {
      currency_code: membership.stores.currency_code,
      currency_symbol: membership.stores.currency_symbol,
      currency_decimals: membership.stores.currency_decimals,
      symbol_position: membership.stores.symbol_position,
    },
  };

  return (
    <StoreProvider value={contextValue}>
      <StoreSidebarLayout
        storeName={contextValue.storeName}
        basePath={`/dashboard/store/${contextValue.storeId}`}
      >
        {children}
      </StoreSidebarLayout>
    </StoreProvider>
  );
}

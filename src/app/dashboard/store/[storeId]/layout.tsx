import { redirect } from "next/navigation";
import {
  StoreProvider,
  type StoreContextValue,
} from "@/lib/store-context";
import { StoreSidebarLayout } from "@/components/layout/StoreSidebarLayout";
import { StoreSuspendedScreen } from "@/components/stores/StoreSuspendedScreen";
import { getCurrentUser } from "@/lib/queries/auth";
import { getStoreLayoutData } from "@/lib/queries/settings";

export default async function StoreScopedLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const data = await getStoreLayoutData({
    userId: user.id,
    storeId,
  });

  if (!data) redirect("/dashboard");

  if (data.store.is_suspended) {
    return <StoreSuspendedScreen storeName={data.store.name} />;
  }

  const contextValue: StoreContextValue = {
    storeId: data.store.id,
    storeName: data.store.name,
    role: data.role,
    currency: {
      currency_code: data.store.currency_code,
      currency_symbol: data.store.currency_symbol,
      currency_decimals: data.store.currency_decimals,
      symbol_position: data.store.symbol_position,
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
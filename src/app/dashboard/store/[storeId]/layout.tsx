import { StoreSidebarLayout } from "@/components/layout/StoreSidebarLayout";
import { getCurrentUser } from "@/features/auth/queries";
import {
  StoreProvider,
  type StoreContextValue,
} from "@/features/pos/store-context";
import { getStoreLayoutData } from "@/features/settings/queries";
import { StoreSuspendedScreen } from "@/features/stores/components/StoreSuspendedScreen";
import { redirect } from "next/navigation";

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

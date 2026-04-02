import { getCurrentUser } from "@/features/auth/queries";
import { PromotionsManager } from "@/features/promotions/components/PromotionsManager";
import { getPromotionsPageData } from "@/features/promotions/queries";
import { redirect } from "next/navigation";

export const metadata = { title: "Promotions" };

export default async function PromotionsPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const data = await getPromotionsPageData({ userId: user.id, storeId });
  if (!data) redirect("/dashboard");

  return (
    <section className="space-y-6">
      <PromotionsManager
        storeId={storeId}
        role={data.role}
        currency={{
          currency_code: data.store.currency_code,
          currency_symbol: data.store.currency_symbol,
          currency_decimals: data.store.currency_decimals,
          symbol_position: data.store.symbol_position,
        }}
        promotions={data.promotions}
      />
    </section>
  );
}

import { getCurrentUser } from "@/features/auth/queries";
import { PosTerminal } from "@/features/pos/components/PosTerminal";
import { getPosPageData } from "@/features/pos/queries";
import { getAvailablePromotions } from "@/features/promotions/queries";
import { redirect } from "next/navigation";

export default async function PosPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const data = await getPosPageData({ userId: user.id, storeId });
  if (!data) redirect("/dashboard");

  const availablePromotions = await getAvailablePromotions(storeId);

  return (
    <PosTerminal
      availablePromotions={availablePromotions}
      bnplAccounts={data.bnplAccounts}
      canCreateBnplAccount={data.canCreateBnplAccount}
      products={data.products}
      qrChannels={data.qrChannels}
    />
  );
}

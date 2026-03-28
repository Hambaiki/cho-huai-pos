import { redirect } from "next/navigation";
import { PosTerminal } from "@/components/pos/PosTerminal";
import { getCurrentUser } from "@/lib/queries/auth";
import { getPosPageData } from "@/lib/queries/pos";

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

  return (
    <PosTerminal
      bnplAccounts={data.bnplAccounts}
      canCreateBnplAccount={data.canCreateBnplAccount}
      products={data.products}
      qrChannels={data.qrChannels}
    />
  );
}

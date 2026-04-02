import { getCurrentUser } from "@/features/auth/queries";
import { BnplAccountsPageClient } from "@/features/bnpl/components/BnplAccountsPageClient";
import { getPaginatedBnplAccountsData } from "@/features/bnpl/queries";
import { parseCsvList, parsePositivePage } from "@/lib/utils/search-params";
import { redirect } from "next/navigation";

export const metadata = { title: "BNPL Accounts" };

const PAGE_SIZE = 10;

type BnplSearchParams = {
  page?: string;
  query?: string;
  statuses?: string;
  balanceStatuses?: string;
};

export default async function BnplPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<BnplSearchParams>;
}) {
  const { storeId } = await params;
  const resolvedSearchParams = await searchParams;
  const currentPage = parsePositivePage(resolvedSearchParams.page);
  const query = resolvedSearchParams.query?.trim() ?? "";
  const statuses = parseCsvList(resolvedSearchParams.statuses);
  const balanceStatuses = parseCsvList(resolvedSearchParams.balanceStatuses);

  const user = await getCurrentUser();

  if (!user) redirect("/login");

  const { membership, isManager, currency, accounts, totalItems } =
    await getPaginatedBnplAccountsData({
      userId: user.id,
      storeId,
      query,
      statuses,
      balanceStatuses,
      page: currentPage,
      pageSize: PAGE_SIZE,
    });

  if (!membership?.store_id) {
    redirect("/dashboard");
  }

  return (
    <BnplAccountsPageClient
      accounts={accounts}
      currency={currency}
      isManager={isManager}
      storeId={storeId}
      currentPage={currentPage}
      totalItems={totalItems}
      pageSize={PAGE_SIZE}
      initialQuery={query}
      initialStatuses={statuses}
      initialBalanceStatuses={balanceStatuses}
    />
  );
}

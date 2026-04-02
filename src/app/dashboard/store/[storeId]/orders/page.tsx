import { getCurrentUser } from "@/features/auth/queries";
import { OrdersPageClient } from "@/features/orders/components/OrdersPageClient";
import { getPaginatedOrdersData } from "@/features/orders/queries";
import { parseCsvList, parsePositivePage } from "@/lib/utils/search-params";
import { redirect } from "next/navigation";

export const metadata = { title: "Orders" };

const PAGE_SIZE = 10;

type OrdersSearchParams = {
  page?: string;
  query?: string;
  statuses?: string;
  methods?: string;
};

export default async function OrdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<OrdersSearchParams>;
}) {
  const { storeId } = await params;
  const resolvedSearchParams = await searchParams;
  const currentPage = parsePositivePage(resolvedSearchParams.page);
  const query = resolvedSearchParams.query?.trim() ?? "";
  const statuses = parseCsvList(resolvedSearchParams.statuses);
  const methods = parseCsvList(resolvedSearchParams.methods);

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const data = await getPaginatedOrdersData({
    userId: user.id,
    storeId,
    query,
    statuses,
    methods,
    page: currentPage,
    pageSize: PAGE_SIZE,
  });

  if (!data) redirect("/dashboard");

  return (
    <OrdersPageClient
      orders={data.orders}
      currency={data.currency}
      storeId={storeId}
      currentPage={currentPage}
      totalItems={data.totalItems}
      pageSize={PAGE_SIZE}
      initialQuery={query}
      initialStatuses={statuses}
      initialMethods={methods}
    />
  );
}

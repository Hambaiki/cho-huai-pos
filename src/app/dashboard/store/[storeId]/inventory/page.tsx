import { InventoryContent } from "@/components/inventory/InventoryContent";
import { getInventoryListData } from "@/lib/queries/inventory";
import { parseCsvList, parsePositivePage } from "@/lib/utils/search-params";

export const metadata = {
  title: "Inventory - CHO-HUAI POS",
};

const PAGE_SIZE = 10;

type InventorySearchParams = {
  page?: string;
  query?: string;
  statuses?: string;
  stockStatuses?: string;
  categories?: string;
};

export default async function InventoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<InventorySearchParams>;
}) {
  const { storeId } = await params;
  const resolvedSearchParams = await searchParams;
  const currentPage = parsePositivePage(resolvedSearchParams.page);
  const query = resolvedSearchParams.query?.trim() ?? "";
  const statuses = parseCsvList(resolvedSearchParams.statuses);
  const stockStatuses = parseCsvList(resolvedSearchParams.stockStatuses);
  const categoryIds = parseCsvList(resolvedSearchParams.categories);

  const { error, products, categoryOptions, totalItems } =
    await getInventoryListData({
      storeId,
      query,
      statuses,
      stockStatuses,
      categoryIds,
      page: currentPage,
      pageSize: PAGE_SIZE,
    });

  if (error) {
    return (
      <section className="rounded-lg border border-danger-200 bg-danger-50 p-6">
        <h2 className="text-lg font-semibold text-danger-900">Error loading products</h2>
        <p className="mt-2 text-sm text-danger-700">{error.message}</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <InventoryContent
        products={products}
        currentPage={currentPage}
        totalItems={totalItems}
        pageSize={PAGE_SIZE}
        initialQuery={query}
        initialStatuses={statuses}
        initialStockStatuses={stockStatuses}
        initialCategoryIds={categoryIds}
        categoryOptions={categoryOptions}
      />
    </section>
  );
}

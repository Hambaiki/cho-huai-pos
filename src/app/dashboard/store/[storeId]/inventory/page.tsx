import { createClient } from "@/lib/supabase/server";
import { InventoryContent } from "@/components/inventory/InventoryContent";

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

type ProductRow = {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  image_url: string | null;
  price: number;
  cost_price: number | null;
  stock_qty: number;
  low_stock_at: number;
  unit: string;
  is_active: boolean;
  category_id: string | null;
  category_name: string | null;
  total_count: number;
};

type CategoryRow = {
  id: string;
  name: string;
};

function parsePage(value?: string) {
  const parsed = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function parseList(value?: string) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default async function InventoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<InventorySearchParams>;
}) {
  const { storeId } = await params;
  const resolvedSearchParams = await searchParams;
  const currentPage = parsePage(resolvedSearchParams.page);
  const query = resolvedSearchParams.query?.trim() ?? "";
  const statuses = parseList(resolvedSearchParams.statuses);
  const stockStatuses = parseList(resolvedSearchParams.stockStatuses);
  const categoryIds = parseList(resolvedSearchParams.categories);

  const supabase = await createClient();

  const { data: products, error } = await supabase.rpc("paginated_products", {
    p_store_id: storeId,
    p_query: query || null,
    p_statuses: statuses.length > 0 ? statuses : null,
    p_stock_statuses: stockStatuses.length > 0 ? stockStatuses : null,
    p_category_ids: categoryIds.length > 0 ? categoryIds : null,
    p_page: currentPage,
    p_page_size: PAGE_SIZE,
  });

  const { data: categoriesData } = await supabase
    .from("categories")
    .select("id, name")
    .eq("store_id", storeId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    return (
      <section className="rounded-lg border border-danger-200 bg-danger-50 p-6">
        <h2 className="text-lg font-semibold text-danger-900">Error loading products</h2>
        <p className="mt-2 text-sm text-danger-700">{error.message}</p>
      </section>
    );
  }

  const productRows = (products ?? []) as ProductRow[];

  const mappedProducts = productRows.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    barcode: p.barcode,
    imageUrl: p.image_url,
    price: p.price,
    costPrice: p.cost_price,
    stockQty: p.stock_qty,
    lowStockAt: p.low_stock_at,
    unit: p.unit,
    isActive: p.is_active,
    categoryId: p.category_id,
    categoryName: p.category_name,
  }));

  const categoryOptions = ((categoriesData ?? []) as CategoryRow[]).map((category) => ({
    value: category.id,
    label: category.name,
  }));

  const totalItems = productRows[0]?.total_count ?? 0;

  return (
    <section className="space-y-6">
      <InventoryContent
        products={mappedProducts}
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

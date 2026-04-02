"use client";

import { FilterSelect } from "@/components/interactive/FilterSelect";
import { PaginationControls } from "@/components/interactive/PaginationControls";
import { SearchInput } from "@/components/interactive/SearchInput";
import { Button } from "@/components/ui/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { cn } from "@/lib/utils/cn";
import { formatCurrency, type CurrencyStore } from "@/lib/utils/currency";
import { AlertTriangle, CirclePlus, ExternalLink } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { STATUS_OPTIONS, STOCK_STATUS_OPTIONS } from "../constants";
import { CategoryOption, Product } from "../types";

interface ProductListProps {
  products: Product[];
  currency: CurrencyStore;
  currentPage: number;
  totalItems: number;
  pageSize: number;
  initialQuery: string;
  initialStatuses: string[];
  initialStockStatuses: string[];
  initialCategoryIds: string[];
  categoryOptions: CategoryOption[];
  onNewProduct?: () => void;
}

export function ProductList({
  products,
  currency,
  currentPage,
  totalItems,
  pageSize,
  initialQuery,
  initialStatuses,
  initialStockStatuses,
  initialCategoryIds,
  categoryOptions,
  onNewProduct,
}: ProductListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const hasFilters =
    initialQuery.length > 0 ||
    initialStatuses.length > 0 ||
    initialStockStatuses.length > 0 ||
    initialCategoryIds.length > 0;

  const updateParams = useMemo(
    () => (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (!value) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname);
    },
    [pathname, router, searchParams],
  );

  if (totalItems === 0 && !hasFilters) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-6 py-12 text-center">
        <p className="text-neutral-600">
          No products yet. Create your first product to get started.
        </p>
        <Button
          type="button"
          onClick={onNewProduct}
          icon={<CirclePlus size={16} />}
          className="mt-4"
        >
          Create Product
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <SearchInput
          className="min-w-60"
          placeholder="Search by product name, SKU, or barcode..."
          initialValue={initialQuery}
          onSearch={(value) =>
            updateParams({
              query: value.trim() || null,
              page: null,
            })
          }
        />
        <FilterSelect
          label="Status"
          options={STATUS_OPTIONS}
          selected={initialStatuses}
          onSelect={(selected) =>
            updateParams({
              statuses: selected.length > 0 ? selected.join(",") : null,
              page: null,
            })
          }
        />
        <FilterSelect
          label="Stock"
          options={STOCK_STATUS_OPTIONS}
          selected={initialStockStatuses}
          onSelect={(selected) =>
            updateParams({
              stockStatuses: selected.length > 0 ? selected.join(",") : null,
              page: null,
            })
          }
        />
        <FilterSelect
          label="Type"
          options={categoryOptions}
          selected={initialCategoryIds}
          onSelect={(selected) =>
            updateParams({
              categories: selected.length > 0 ? selected.join(",") : null,
              page: null,
            })
          }
        />
      </div>

      {hasFilters && (
        <div className="text-xs text-neutral-500">
          Found {totalItems} matching product{totalItems === 1 ? "" : "s"}
        </div>
      )}

      <TableContainer>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-6">Name</TableHead>
              <TableHead className="px-6">SKU</TableHead>
              <TableHead className="px-6">Type</TableHead>
              <TableHead className="px-6 text-right">Price</TableHead>
              <TableHead className="px-6 text-right">Stock</TableHead>
              <TableHead className="px-6 text-center">Status</TableHead>
              <TableHead className="px-6 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-12 text-center text-neutral-400"
                >
                  {hasFilters
                    ? "No products match your filters."
                    : "No products yet."}
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id} className="border-neutral-200">
                  <TableCell className="text-neutral-900">
                    <div className="flex items-center gap-3">
                      {product.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.imageUrl}
                          alt={`${product.name} image`}
                          className="h-10 w-10 rounded object-cover shrink-0"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded bg-neutral-100 text-xs font-medium text-neutral-500">
                          N/A
                        </div>
                      )}

                      <div>
                        <div className="font-medium">{product.name}</div>
                        {product.barcode && (
                          <div className="text-xs text-neutral-500">
                            {product.barcode}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-neutral-600">
                    {product.sku || "—"}
                  </TableCell>
                  <TableCell className="text-neutral-600">
                    {product.categoryName || "Uncategorized"}
                  </TableCell>
                  <TableCell className="text-right font-medium text-neutral-900">
                    {formatCurrency(product.price, currency)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={cn(
                          "font-medium",
                          product.stockQty <= product.lowStockAt
                            ? "text-danger-600"
                            : "text-neutral-900",
                        )}
                      >
                        {product.stockQty} {product.unit}
                      </span>
                      {product.stockQty <= product.lowStockAt && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-danger-600">
                          <AlertTriangle size={12} className="shirnk-0" />
                          Low stock
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={cn(
                        "inline-block rounded-full px-2 py-1 text-xs font-medium",
                        product.isActive
                          ? "bg-success-100 text-success-700"
                          : "bg-neutral-100 text-neutral-600",
                      )}
                    >
                      {product.isActive ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`${pathname.replace(/\?.*$/, "")}/${product.id}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-neutral-500 transition hover:text-neutral-800"
                      >
                        <ExternalLink size={14} />
                        Details
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <PaginationControls
        currentPage={currentPage}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={(page) => updateParams({ page: String(page) })}
      />
    </div>
  );
}

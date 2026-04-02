"use client";

import { Button } from "@/components/ui/Button";
import { FormInput } from "@/components/ui/form";
import { cn } from "@/lib/utils/cn";
import { formatCurrency, type CurrencyStore } from "@/lib/utils/currency";
import { ImageOff, ScanBarcode, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export interface PosProduct {
  id: string;
  name: string;
  price: number;
  stock_qty: number;
  image_url?: string | null;
  category_id?: string | null;
  category_name?: string | null;
  barcode?: string | null;
  sku?: string | null;
}

interface ProductGridProps {
  products: PosProduct[];
  currency: CurrencyStore;
  onAdd: (product: PosProduct) => void;
  onScanProduct?: () => void;
  className?: string;
}

export function ProductGrid({
  products,
  currency,
  onAdd,
  onScanProduct,
  className,
}: ProductGridProps) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<
    "all" | "in-stock" | "out-of-stock"
  >("all");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTypingInInput =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (event.key === "/" && !isTypingInInput) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const normalizedQuery = query.trim().toLowerCase();

  const categoryTabs = useMemo(() => {
    const map = new Map<
      string,
      { value: string; label: string; count: number }
    >();

    products.forEach((product) => {
      const value = product.category_id ?? "uncategorized";
      const label = product.category_name ?? "Uncategorized";
      const existing = map.get(value);

      if (existing) {
        existing.count += 1;
      } else {
        map.set(value, { value, label, count: 1 });
      }
    });

    return [
      { value: "all", label: "All", count: products.length },
      ...Array.from(map.values()).sort((a, b) =>
        a.label.localeCompare(b.label),
      ),
    ];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const selectedCategory =
        categoryFilter === "all"
          ? true
          : categoryFilter === "uncategorized"
            ? !product.category_id
            : product.category_id === categoryFilter;

      const matchesSearch =
        normalizedQuery.length === 0 ||
        product.name.toLowerCase().includes(normalizedQuery);

      const inStock = product.stock_qty > 0;
      const matchesStockFilter =
        stockFilter === "all" ||
        (stockFilter === "in-stock" && inStock) ||
        (stockFilter === "out-of-stock" && !inStock);

      return selectedCategory && matchesSearch && matchesStockFilter;
    });
  }, [categoryFilter, normalizedQuery, products, stockFilter]);

  const inStockCount = useMemo(
    () => products.filter((product) => product.stock_qty > 0).length,
    [products],
  );

  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 text-sm text-neutral-500">
        No products yet. Add items in Inventory to start selling.
      </div>
    );
  }

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
          />
          <FormInput
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search product name..."
            className="min-w-55 pl-10 bg-white"
            aria-label="Search products"
          />
        </div>

        {query.trim().length > 0 ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setQuery("")}
          >
            Clear
          </Button>
        ) : null}

        {onScanProduct && (
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => onScanProduct()}
            title="Scan barcode with camera to add product"
            icon={<ScanBarcode size={16} />}
          >
            Scan product
          </Button>
        )}
      </div>

      <div
        className={cn(
          "hidden",
          // "mt-3 flex flex-wrap items-center gap-3",
        )}
      >
        <p className="font-medium text-base text-neutral-500">Stock:</p>
        <Button
          type="button"
          variant={stockFilter === "all" ? "active" : "outline"}
          size="sm"
          onClick={() => setStockFilter("all")}
        >
          Any stock ({products.length})
        </Button>
        <Button
          type="button"
          variant={stockFilter === "in-stock" ? "active" : "outline"}
          size="sm"
          onClick={() => setStockFilter("in-stock")}
        >
          In stock ({inStockCount})
        </Button>
        <Button
          type="button"
          variant={stockFilter === "out-of-stock" ? "active" : "outline"}
          size="sm"
          onClick={() => setStockFilter("out-of-stock")}
        >
          Out of stock ({products.length - inStockCount})
        </Button>
      </div>

      <p className="mt-3 text-xs text-neutral-500">
        Showing {filteredProducts.length} of {products.length} products. Press /
        to focus search.
      </p>

      <div
        className={cn(
          "mt-3 flex min-h-0 flex-1 flex-col",
          // "rounded-2xl border border-border bg-surface p-3",
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          {categoryTabs.map((tab) => (
            <Button
              key={tab.value}
              type="button"
              variant={categoryFilter === tab.value ? "active" : "outline"}
              size="sm"
              onClick={() => setCategoryFilter(tab.value)}
            >
              {tab.label} ({tab.count})
            </Button>
          ))}
        </div>

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
          {filteredProducts.length === 0 ? (
            <div className="rounded-2xl border border-border bg-surface p-6 text-sm text-neutral-500">
              No products matched this search/filter.
            </div>
          ) : (
            <div className="grid gap-3 grid-cols-2 md:grid-cols-3 2xl:grid-cols-4">
              {filteredProducts.map((product) => {
                const outOfStock = product.stock_qty <= 0;

                return (
                  <Button
                    size="lg"
                    variant="outline"
                    className={cn(
                      "grid h-auto grid-cols-1 items-stretch gap-3 p-2 text-left",
                      "disabled:cursor-not-allowed disabled:opacity-50",
                      "transition cursor-pointer disabled:cursor-not-allowed",
                    )}
                    disabled={outOfStock}
                    key={product.id}
                    onClick={() => onAdd(product)}
                    type="button"
                  >
                    <div className="h-36 w-full overflow-hidden rounded-md border border-neutral-200 bg-neutral-50">
                      {product.image_url ? (
                        <div
                          className="h-full w-full bg-contain bg-center bg-no-repeat"
                          style={{
                            backgroundImage: `url(${product.image_url})`,
                          }}
                        />
                      ) : (
                        <div className="flex flex-col h-full w-full items-center justify-center text-xs font-medium text-neutral-500">
                          <ImageOff size={24} />
                          No image
                        </div>
                      )}
                    </div>

                    <div className="flex min-w-0 flex-col justify-between gap-1">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-neutral-900">
                          {product.name}
                        </p>
                        <p className="truncate text-xs text-neutral-500">
                          {product.category_name ?? "Uncategorized"}
                        </p>
                      </div>

                      <p className="text-sm font-semibold text-neutral-800">
                        {formatCurrency(product.price, currency)}
                      </p>

                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "rounded-full px-2 py-1 text-[11px] font-medium",
                            outOfStock
                              ? "bg-danger-100 text-danger-700"
                              : "bg-success-100 text-success-700",
                          )}
                        >
                          Stock {product.stock_qty}
                        </span>
                        <span className="text-xs font-medium text-brand-700">
                          {outOfStock ? "Out of stock" : "Add to cart"}
                        </span>
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

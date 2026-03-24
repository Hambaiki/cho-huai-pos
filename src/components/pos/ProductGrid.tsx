"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatCurrency, type CurrencyStore } from "@/lib/utils/currency";
import { Search } from "lucide-react";

export interface PosProduct {
  id: string;
  name: string;
  price: number;
  stock_qty: number;
}

interface ProductGridProps {
  products: PosProduct[];
  currency: CurrencyStore;
  onAdd: (product: PosProduct) => void;
}

export function ProductGrid({ products, currency, onAdd }: ProductGridProps) {
  const [query, setQuery] = useState("");
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

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        normalizedQuery.length === 0 ||
        product.name.toLowerCase().includes(normalizedQuery);

      const inStock = product.stock_qty > 0;
      const matchesStockFilter =
        stockFilter === "all" ||
        (stockFilter === "in-stock" && inStock) ||
        (stockFilter === "out-of-stock" && !inStock);

      return matchesSearch && matchesStockFilter;
    });
  }, [normalizedQuery, products, stockFilter]);

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
    <div className="flex h-full min-h-0 flex-col rounded-2xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
          />
          <input
            ref={searchInputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search product name..."
            className="min-w-55 pl-10 flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            aria-label="Search products"
          />
        </div>
        {query.trim().length > 0 ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="rounded-lg border border-border px-3 py-2 text-sm text-neutral-700 transition hover:bg-neutral-50"
          >
            Clear
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setStockFilter("all")}
          className={`rounded-lg border px-3 py-2 text-sm transition ${
            stockFilter === "all"
              ? "border-brand-500 bg-brand-50 text-brand-800"
              : "border-border text-neutral-700 hover:bg-neutral-50"
          }`}
        >
          All ({products.length})
        </button>
        <button
          type="button"
          onClick={() => setStockFilter("in-stock")}
          className={`rounded-lg border px-3 py-2 text-sm transition ${
            stockFilter === "in-stock"
              ? "border-brand-500 bg-brand-50 text-brand-800"
              : "border-border text-neutral-700 hover:bg-neutral-50"
          }`}
        >
          In stock ({inStockCount})
        </button>
        <button
          type="button"
          onClick={() => setStockFilter("out-of-stock")}
          className={`rounded-lg border px-3 py-2 text-sm transition ${
            stockFilter === "out-of-stock"
              ? "border-brand-500 bg-brand-50 text-brand-800"
              : "border-border text-neutral-700 hover:bg-neutral-50"
          }`}
        >
          Out of stock ({products.length - inStockCount})
        </button>
      </div>

      <p className="my-4 text-xs text-neutral-500">
        Showing {filteredProducts.length} of {products.length} products. Press /
        to focus search.
      </p>

      {filteredProducts.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-6 text-sm text-neutral-500">
          No products matched this search/filter.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 min-h-0 overflow-y-auto pr-1">
          {filteredProducts.map((product) => {
            const outOfStock = product.stock_qty <= 0;

            return (
              <button
                className="rounded-2xl border border-border bg-surface p-4 text-left transition hover:border-brand-200 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={outOfStock}
                key={product.id}
                onClick={() => onAdd(product)}
                type="button"
              >
                <p className="text-sm font-semibold text-neutral-900">
                  {product.name}
                </p>
                <p className="mt-1 text-sm text-neutral-700">
                  {formatCurrency(product.price, currency)}
                </p>
                <p className="mt-2 text-xs text-neutral-500">
                  Stock: {product.stock_qty}
                </p>
                <p className="mt-3 text-sm font-medium text-brand-700">
                  {outOfStock ? "Out of stock" : "Tap to add"}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

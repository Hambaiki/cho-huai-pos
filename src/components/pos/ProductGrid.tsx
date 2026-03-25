"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatCurrency, type CurrencyStore } from "@/lib/utils/currency";
import { Search } from "lucide-react";

export interface PosProduct {
  id: string;
  name: string;
  price: number;
  stock_qty: number;
  category_id?: string | null;
  category_name?: string | null;
}

interface ProductGridProps {
  products: PosProduct[];
  currency: CurrencyStore;
  onAdd: (product: PosProduct) => void;
}

export function ProductGrid({ products, currency, onAdd }: ProductGridProps) {
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
            className="min-w-55 flex-1 rounded-lg border border-border bg-white px-3 py-2 pl-10 text-sm text-neutral-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
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
          Any stock ({products.length})
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

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {categoryTabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setCategoryFilter(tab.value)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              categoryFilter === tab.value
                ? "border-brand-500 bg-brand-50 text-brand-800"
                : "border-border text-neutral-700 hover:bg-neutral-50"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
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
                  {outOfStock ? "Out of stock" : "+ Tap to add"}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

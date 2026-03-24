"use client";

import { formatCurrency, type CurrencyStore } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/cn";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";

interface Product {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  price: number;
  costPrice: number | null;
  stockQty: number;
  lowStockAt: number;
  unit: string;
  isActive: boolean;
}

interface ProductListProps {
  products: Product[];
  currency: CurrencyStore;
  onNewProduct?: () => void;
  onEditProduct?: (product: Product) => void;
}

export function ProductList({ products, currency, onNewProduct, onEditProduct }: ProductListProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-6 py-12 text-center">
        <p className="text-neutral-600">No products yet. Create your first product to get started.</p>
        <button
          onClick={onNewProduct}
          className="mt-4 inline-block rounded-lg bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 transition"
        >
          Create Product
        </button>
      </div>
    );
  }

  return (
    <TableContainer>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="px-6">Name</TableHead>
            <TableHead className="px-6">SKU</TableHead>
            <TableHead className="px-6 text-right">Price</TableHead>
            <TableHead className="px-6 text-right">Stock</TableHead>
            <TableHead className="px-6 text-center">Status</TableHead>
            <TableHead className="px-6 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id} className="border-neutral-200">
              <TableCell className="text-neutral-900">
                <div>
                  <div className="font-medium">{product.name}</div>
                  {product.barcode && (
                    <div className="text-xs text-neutral-500">{product.barcode}</div>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-neutral-600">{product.sku || "—"}</TableCell>
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
                    <span className="text-xs font-medium text-danger-600">Low stock</span>
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
                <button
                  onClick={() => onEditProduct?.(product)}
                  className="text-brand-600 hover:text-brand-700 font-medium transition"
                >
                  Edit
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

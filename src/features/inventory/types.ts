import { Tables } from "@/lib/supabase/types";

export type PaginatedProductRow = Pick<
  Tables<"products">,
  | "id"
  | "name"
  | "sku"
  | "barcode"
  | "price"
  | "cost_price"
  | "stock_qty"
  | "low_stock_at"
  | "unit"
  | "is_active"
  | "category_id"
  | "image_url"
> & {
  category_name: string | null;
  total_count: number;
};

export interface CategoryOption {
  value: string;
  label: string;
}

export interface Product {
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
  categoryId: string | null;
  categoryName: string | null;
  imageUrl: string | null;
}

export interface PurchaseLot {
  id: string;
  receivedQty: number;
  remainingQty: number;
  unitCost: number;
  sourceRef: string | null;
  notes: string | null;
  receivedAt: string;
}

export interface StockAdjustment {
  id: string;
  quantity: number;
  reason: string;
  notes: string | null;
  createdAt: string;
}

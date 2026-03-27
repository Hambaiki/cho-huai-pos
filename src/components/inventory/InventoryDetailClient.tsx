"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Package,
  TrendingUp,
  ArrowDownToLine,
  AlertCircle,
  PencilLine,
  SlidersHorizontal,
} from "lucide-react";
import { useStoreContext } from "@/lib/store-context";
import { formatCurrency } from "@/lib/utils/currency";
import {
  SectionCard,
  SectionCardBody,
  SectionCardHeader,
} from "@/components/ui/SectionCard";
import { Button } from "@/components/ui/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { PageHeader } from "@/components/ui/PageHeader";
import { AdjustStockModal } from "./AdjustStockModal";
import { ProductModal } from "./ProductModal";
import { ReceiveStockModal } from "./ReceiveStockModal";
import { cn } from "@/lib/utils/cn";

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
  categoryId: string | null;
  categoryName: string | null;
  imageUrl: string | null;
  updatedAt: string;
  createdAt: string;
}

interface CategoryOption {
  value: string;
  label: string;
}

interface PurchaseLot {
  id: string;
  receivedQty: number;
  remainingQty: number;
  unitCost: number;
  sourceRef: string | null;
  notes: string | null;
  receivedAt: string;
}

interface StockAdjustment {
  id: string;
  quantity: number;
  reason: string;
  notes: string | null;
  createdAt: string;
}

interface InventoryDetailClientProps {
  storeId: string;
  product: Product;
  categories: CategoryOption[];
  lots: PurchaseLot[];
  adjustments: StockAdjustment[];
  canManage: boolean;
}

const REASON_LABELS: Record<string, string> = {
  purchase: "Purchase",
  return: "Return",
  damage: "Damage",
  loss: "Loss",
  correction: "Correction",
  initial: "Initial",
};

function StockStatusBadge({ qty, lowAt }: { qty: number; lowAt: number }) {
  if (qty === 0)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
        Out of stock
      </span>
    );
  if (qty <= lowAt)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
        Low stock
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
      In stock
    </span>
  );
}

export function InventoryDetailClient({
  product,
  categories,
  lots,
  adjustments,
  canManage,
}: InventoryDetailClientProps) {
  const store = useStoreContext();
  const router = useRouter();
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);

  // Weighted average cost across all lots that still have remaining qty
  const activeLots = lots.filter((l) => l.remainingQty > 0);
  const totalRemaining = activeLots.reduce((s, l) => s + l.remainingQty, 0);
  const weightedAvgCost =
    totalRemaining > 0
      ? activeLots.reduce((s, l) => s + l.remainingQty * l.unitCost, 0) /
        totalRemaining
      : null;

  const inventoryValue =
    weightedAvgCost != null ? product.stockQty * weightedAvgCost : null;

  return (
    <>
      <PageHeader
        title={product.name}
        description={
          [
            product.categoryName,
            product.sku ? `SKU: ${product.sku}` : null,
            product.barcode ? `Barcode: ${product.barcode}` : null,
          ]
            .filter(Boolean)
            .join(" · ") || undefined
        }
        backHref={`/dashboard/store/${store.storeId}/inventory`}
        backLabel="Back to Inventory"
        meta={
          <span className="flex items-center gap-2 flex-wrap">
            <StockStatusBadge
              qty={product.stockQty}
              lowAt={product.lowStockAt}
            />
            {!product.isActive && (
              <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">
                Inactive
              </span>
            )}
          </span>
        }
        actions={
          canManage ? (
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                icon={<PencilLine size={16} />}
                onClick={() => setEditOpen(true)}
              >
                Edit Product
              </Button>
              <Button
                variant="outline"
                icon={<SlidersHorizontal size={16} />}
                onClick={() => setAdjustOpen(true)}
              >
                Adjust Stock
              </Button>
              <Button
                icon={<ArrowDownToLine size={16} />}
                onClick={() => setReceiveOpen(true)}
              >
                Receive Stock
              </Button>
            </div>
          ) : undefined
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-xs text-neutral-500">Current Stock</p>
          <p className="mt-1 text-2xl font-semibold text-neutral-900">
            {product.stockQty}{" "}
            <span className="text-sm font-normal text-neutral-500">
              {product.unit}
            </span>
          </p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-xs text-neutral-500">Selling Price</p>
          <p className="mt-1 text-2xl font-semibold text-neutral-900">
            {formatCurrency(product.price, store.currency)}
          </p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-xs text-neutral-500">Avg. Unit Cost</p>
          <p className="mt-1 text-2xl font-semibold text-neutral-900">
            {weightedAvgCost != null
              ? formatCurrency(weightedAvgCost, store.currency)
              : "—"}
          </p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-xs text-neutral-500">Inventory Value</p>
          <p className="mt-1 text-2xl font-semibold text-neutral-900">
            {inventoryValue != null
              ? formatCurrency(inventoryValue, store.currency)
              : "—"}
          </p>
        </div>
      </div>

      {product.stockQty <= product.lowStockAt && product.stockQty > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertCircle size={16} className="shrink-0" />
          Stock is low. Consider restocking soon.
        </div>
      )}

      {/* Purchase lots */}
      <SectionCard>
        <SectionCardHeader
          title="Purchase Lots"
          description="Each stock-in event with its unit cost. Used for FIFO/LIFO cost allocation."
          headerRight={
            canManage ? (
              <Button
                size="sm"
                variant="outline"
                icon={<ArrowDownToLine size={14} />}
                onClick={() => setReceiveOpen(true)}
              >
                Receive Stock
              </Button>
            ) : undefined
          }
        />
        {lots.length === 0 ? (
          <SectionCardBody>
            <div className="flex flex-col items-center gap-2 py-10 text-neutral-400">
              <Package size={32} className="opacity-50" />
              <p className="text-sm">No purchase lots recorded yet.</p>
            </div>
          </SectionCardBody>
        ) : (
          <div className="overflow-x-auto">
            <Table className="w-full text-sm">
              <TableHeader>
                <TableRow className="border-b border-neutral-100 text-left text-xs text-neutral-500">
                  <TableCell className="px-4 py-2 font-medium">
                    Received
                  </TableCell>
                  <TableCell className="px-4 py-2 font-medium">
                    Unit Cost
                  </TableCell>
                  <TableCell className="px-4 py-2 font-medium">
                    Received Qty
                  </TableCell>
                  <TableCell className="px-4 py-2 font-medium">
                    Remaining
                  </TableCell>
                  <TableCell className="px-4 py-2 font-medium">Ref</TableCell>
                  <TableCell className="px-4 py-2 font-medium">Notes</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-neutral-50">
                {lots.map((lot) => (
                  <TableRow
                    key={lot.id}
                    className={cn(
                      "hover:bg-neutral-50",
                      lot.remainingQty === 0 && "opacity-40",
                    )}
                  >
                    <TableCell className="px-4 py-2 tabular-nums text-neutral-600">
                      {new Date(lot.receivedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="px-4 py-2 font-medium tabular-nums">
                      {formatCurrency(lot.unitCost, store.currency)}
                    </TableCell>
                    <TableCell className="px-4 py-2 tabular-nums">
                      {lot.receivedQty}
                    </TableCell>
                    <TableCell className="px-4 py-2 tabular-nums">
                      <span
                        className={cn(
                          "font-medium",
                          lot.remainingQty === 0
                            ? "text-neutral-400"
                            : "text-green-700",
                        )}
                      >
                        {lot.remainingQty}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-2 text-neutral-500">
                      {lot.sourceRef ?? "—"}
                    </TableCell>
                    <TableCell className="px-4 py-2 text-neutral-500">
                      {lot.notes ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>

      {/* Stock adjustments */}
      <SectionCard>
        <SectionCardHeader
          title="Stock Adjustments"
          description="Manual corrections for damage, loss, returns, and other non-sale events."
          headerRight={
            canManage ? (
              <Button
                size="sm"
                variant="outline"
                icon={<SlidersHorizontal size={14} />}
                onClick={() => setAdjustOpen(true)}
              >
                Adjust Stock
              </Button>
            ) : undefined
          }
        />
        {adjustments.length === 0 ? (
          <SectionCardBody>
            <div className="flex flex-col items-center gap-2 py-10 text-neutral-400">
              <TrendingUp size={32} className="opacity-50" />
              <p className="text-sm">No adjustments recorded.</p>
            </div>{" "}
          </SectionCardBody>
        ) : (
          <div className="overflow-x-auto">
            <Table className="w-full text-sm">
              <TableHeader className="border-b border-neutral-100 text-left text-xs text-neutral-500">
                <TableRow>
                  <TableHead className="px-4 py-2 font-medium">Date</TableHead>
                  <TableHead className="px-4 py-2 font-medium">
                    Reason
                  </TableHead>
                  <TableHead className="px-4 py-2 font-medium">
                    Quantity
                  </TableHead>
                  <TableHead className="px-4 py-2 font-medium">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-neutral-50">
                {adjustments.map((adj) => (
                  <TableRow key={adj.id} className="hover:bg-neutral-50">
                    <TableCell className="px-4 py-2 tabular-nums text-neutral-600">
                      {new Date(adj.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700">
                        {REASON_LABELS[adj.reason] ?? adj.reason}
                      </span>
                    </TableCell>
                    <TableCell
                      className={cn(
                        "px-4 py-2 font-medium tabular-nums",
                        adj.quantity > 0 ? "text-green-700" : "text-red-600",
                      )}
                    >
                      {adj.quantity > 0 ? "+" : ""}
                      {adj.quantity}
                    </TableCell>
                    <TableCell className="px-4 py-2 text-neutral-500">
                      {adj.notes ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>

      <ReceiveStockModal
        open={receiveOpen}
        onClose={() => setReceiveOpen(false)}
        productId={product.id}
        productName={product.name}
        currentCostPrice={product.costPrice}
        onSuccess={() => router.refresh()}
      />

      <AdjustStockModal
        open={adjustOpen}
        onClose={() => setAdjustOpen(false)}
        productId={product.id}
        productName={product.name}
        currentCostPrice={product.costPrice}
        onSuccess={() => router.refresh()}
      />

      <ProductModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        product={{
          id: product.id,
          name: product.name,
          sku: product.sku,
          barcode: product.barcode,
          price: product.price,
          costPrice: product.costPrice,
          stockQty: product.stockQty,
          lowStockAt: product.lowStockAt,
          unit: product.unit,
          categoryId: product.categoryId,
          imageUrl: product.imageUrl,
        }}
        categories={categories}
        onSuccess={() => router.refresh()}
      />
    </>
  );
}

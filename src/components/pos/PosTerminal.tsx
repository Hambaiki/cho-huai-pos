"use client";

import { useEffect, useState, useTransition } from "react";
import { useCartStore } from "@/lib/store/cart";
import { useStoreContext } from "@/lib/store-context";
import { createOrderAction } from "@/lib/actions/orders";
import { ProductGrid, type PosProduct } from "@/components/pos/ProductGrid";
import { BarcodeCameraScanner } from "@/components/pos/BarcodeCameraScanner";
import type { CartItem } from "@/lib/store/cart";
import { CartPanel } from "@/components/pos/CartPanel";
import { PaymentModal } from "@/components/pos/PaymentModal";
import { ReceiptModal } from "@/components/pos/ReceiptModal";
import { PageHeader } from "@/components/ui/PageHeader";
import type { QrChannel } from "@/components/pos/QrPaymentScreen";
import type { CreateOrderResult } from "@/lib/actions/orders";
import type { BnplAccountSummary } from "@/lib/types/bnpl";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { toast } from "@/lib/utils/toast";
import { useSyncPendingAction } from "@/components/ui/PendingActionProvider";

interface PosTerminalProps {
  products: PosProduct[];
  qrChannels?: QrChannel[];
  bnplAccounts?: BnplAccountSummary[];
  canCreateBnplAccount?: boolean;
}

export function PosTerminal({
  products: initialProducts,
  qrChannels = [],
  bnplAccounts = [],
  canCreateBnplAccount = false,
}: PosTerminalProps) {
  const RECEIPT_CLOSE_ANIMATION_MS = 160;

  const store = useStoreContext();

  const [products, setProducts] = useState<PosProduct[]>(initialProducts);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receipt, setReceipt] = useState<
    Extract<CreateOrderResult, { data: unknown }>["data"] | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useSyncPendingAction(isPending, {
    message: "Recording order…",
  });

  const { items, addItem, setQuantity, removeItem, clearCart } = useCartStore();

  useEffect(() => {
    if (isReceiptOpen || !receipt) return;

    const timer = window.setTimeout(() => {
      setReceipt(null);
    }, RECEIPT_CLOSE_ANIMATION_MS);

    return () => window.clearTimeout(timer);
  }, [isReceiptOpen, receipt]);

  const payable = Math.max(
    0,
    items.reduce(
      (sum, item) => sum + (item.unitPrice - item.discount) * item.quantity,
      0,
    ),
  );

  const handleAddItem = (product: PosProduct) => {
    toast.success(`${product.name} added to cart`);
    addItem({
      productId: product.id,
      name: product.name,
      imageUrl: product.image_url,
      unitPrice: Number(product.price),
      stockQty: product.stock_qty,
    });
  };

  const handleRemoveItem = (productId: string) => {
    toast.warning(`Item removed from cart`);
    removeItem(productId);
  };

  const [showCameraScanner, setShowCameraScanner] = useState(false);

  // Handle barcode scan
  const handleBarcodeDetected = (barcode: string) => {
    const product = products.find(
      (p) =>
        p.barcode?.toLowerCase() === barcode.toLowerCase() ||
        p.sku?.toLowerCase() === barcode.toLowerCase(),
    );

    if (!product) {
      toast.error(`Product with barcode/sku "${barcode}" not found`);
      return;
    }

    if (product.stock_qty > 0) {
      handleAddItem(product);
    } else {
      toast.warning(`Product "${product.name}" is out of stock`);
    }
  };

  // Use hardware barcode scanner hook
  useBarcodeScanner({ onBarcode: handleBarcodeDetected });

  return (
    <section className="grid gap-4 lg:h-full lg:grid-cols-[1.55fr_0.7fr]">
      <div className="flex min-h-0 flex-col space-y-3">
        <PageHeader title="POS Terminal" />
        <ProductGrid
          currency={store.currency}
          products={products}
          onAdd={handleAddItem}
          onScanProduct={() => setShowCameraScanner(true)}
        />
      </div>

      <CartPanel
        currency={store.currency}
        items={items}
        onClearAll={clearCart}
        onCheckout={() => setIsPaymentOpen(true)}
        onQuantityChange={setQuantity}
        onRemove={handleRemoveItem}
        total={payable}
        products={products}
      />

      <PaymentModal
        amount={payable}
        bnplAccounts={bnplAccounts}
        canCreateBnplAccount={canCreateBnplAccount}
        currency={store.currency}
        qrChannels={qrChannels}
        storeId={store.storeId}
        onClose={() => setIsPaymentOpen(false)}
        onConfirm={(payment) => {
          startTransition(async () => {
            const result = await createOrderAction({
              storeId: store.storeId,
              paymentMethod: payment.paymentMethod,
              amountTendered: payment.amountTendered,
              qrChannelId: payment.qrChannelId,
              qrReference: payment.qrReference,
              bnplAccountId: payment.bnplAccountId,
              bnplDueDate: payment.bnplDueDate,
              items: items.map((item) => ({
                productId: item.productId,
                productName: item.name,
                unitPrice: item.unitPrice,
                quantity: item.quantity,
                discount: item.discount,
              })),
            });

            if (result.error) {
              setError(result.error);
              return;
            }

            if (!result.data) {
              setError("Order submission failed unexpectedly.");
              return;
            }

            // Optimistically decrement stock in the local product list so the
            // grid reflects the sale immediately without waiting for a server
            // round-trip from revalidatePath.
            setProducts((prev) =>
              prev.map((p) => {
                const sold = items.find((i: CartItem) => i.productId === p.id);
                if (!sold) return p;
                return {
                  ...p,
                  stock_qty: Math.max(0, p.stock_qty - sold.quantity),
                };
              }),
            );

            clearCart();
            setIsPaymentOpen(false);
            setError(null);
            setReceipt(result.data);
            setIsReceiptOpen(true);
          });
        }}
        open={isPaymentOpen}
      />

      {error ? (
        <div className="lg:col-span-2 rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">
          {error}
        </div>
      ) : null}
      {isPending ? (
        <div className="lg:col-span-2 text-sm text-neutral-500">
          Submitting order...
        </div>
      ) : null}

      {receipt && (
        <ReceiptModal
          open={isReceiptOpen}
          orderId={receipt.orderId}
          storeName={store.storeName}
          currency={store.currency}
          items={receipt.items}
          subtotal={receipt.subtotal}
          discount={receipt.discount}
          total={receipt.total}
          amountTendered={receipt.amountTendered}
          changeAmount={receipt.changeAmount}
          paymentMethod={receipt.paymentMethod}
          createdAt={receipt.createdAt}
          onClose={() => setIsReceiptOpen(false)}
        />
      )}

      <BarcodeCameraScanner
        isOpen={showCameraScanner}
        onClose={() => setShowCameraScanner(false)}
        onBarcode={handleBarcodeDetected}
      />
    </section>
  );
}

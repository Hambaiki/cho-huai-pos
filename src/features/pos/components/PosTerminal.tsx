"use client";

import { BarcodeCameraScanner } from "@/components/BarcodeCameraScanner";
import { PageHeader } from "@/components/content/PageHeader";
import type { QrChannel } from "@/components/QrPaymentScreen";
import { Button } from "@/components/ui/Button";
import { Drawer, DrawerBody, DrawerHeader } from "@/components/ui/Drawer";
import type { BnplAccountSummary } from "@/features/bnpl/types";
import { createOrderAction } from "@/features/orders/action";
import type { CreateOrderResult } from "@/features/orders/validations";
import { validatePromoCodeAction } from "@/features/promotions/actions";
import type { CartItem } from "@/features/pos/store/cart";
import { CartPanel } from "@/features/pos/components/CartPanel";
import { PaymentModal } from "@/features/pos/components/PaymentModal";
import {
  ProductGrid,
  type PosProduct,
} from "@/features/pos/components/ProductGrid";
import { ReceiptModal } from "@/features/pos/components/ReceiptModal";
import { useStoreContext } from "@/features/pos/store-context";
import { useCartStore } from "@/features/pos/store/cart";
import { useSyncPendingAction } from "@/features/shell/pending/PendingActionProvider";
import { toast } from "@/features/shell/toaster/toaster";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/currency";
import { ChevronUp, ShoppingCart } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";

interface PosTerminalProps {
  products: PosProduct[];
  availablePromotions?: Array<{
    code: string | null;
    name: string;
    isAutomatic: boolean;
  }>;
  qrChannels?: QrChannel[];
  bnplAccounts?: BnplAccountSummary[];
  canCreateBnplAccount?: boolean;
}

export function PosTerminal({
  products: initialProducts,
  availablePromotions: initialAvailablePromotions = [],
  qrChannels = [],
  bnplAccounts = [],
  canCreateBnplAccount = false,
}: PosTerminalProps) {
  const RECEIPT_CLOSE_ANIMATION_MS = 160;

  const store = useStoreContext();

  const [products, setProducts] = useState<PosProduct[]>(initialProducts);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receipt, setReceipt] = useState<
    Extract<CreateOrderResult, { data: unknown }>["data"] | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Promo code validation state
  const [availablePromotions] = useState<
    Array<{ code: string | null; name: string; isAutomatic: boolean }>
  >(initialAvailablePromotions);
  const [promoCodeDiscount, setPromoCodeDiscount] = useState(0);
  const [promoCodeMessage, setPromoCodeMessage] = useState<string>();
  const [promoCodeError, setPromoCodeError] = useState<string>();
  const [isValidatingPromoCode, setIsValidatingPromoCode] = useState(false);
  const promoValidationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useSyncPendingAction(isPending, {
    message: "Recording order…",
  });

  const { items, addItem, setQuantity, removeItem, clearCart } = useCartStore();

  const {
    setItemDiscount,
    setOrderDiscount,
    setPromoCode,
    orderDiscount,
    promoCode,
    subtotal,
    itemDiscountTotal,
  } = useCartStore();

  // Validate promo code when it changes (with debounce)
  useEffect(() => {
    if (promoValidationTimeoutRef.current) {
      clearTimeout(promoValidationTimeoutRef.current);
    }

    if (!promoCode || promoCode.trim() === "") {
      setIsValidatingPromoCode(false);
      setPromoCodeDiscount(0);
      setPromoCodeMessage(undefined);
      setPromoCodeError(undefined);
      return;
    }

    setIsValidatingPromoCode(true);

    promoValidationTimeoutRef.current = setTimeout(async () => {
      const subtotalAmount = items.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0,
      );
      const itemDiscountAmount = items.reduce(
        (sum, item) => sum + item.discount * item.quantity,
        0,
      );
      const discountBeforeTax = Math.max(0, itemDiscountAmount + orderDiscount);
      const orderTotal = Math.max(0, subtotalAmount - discountBeforeTax);

      try {
        const result = await validatePromoCodeAction({
          storeId: store.storeId,
          promoCode,
          orderTotal,
        });

        if (result.isValid) {
          setPromoCodeDiscount(result.discount);
          setPromoCodeMessage(result.message);
          setPromoCodeError(undefined);
        } else {
          setPromoCodeDiscount(0);
          setPromoCodeMessage(undefined);
          setPromoCodeError(result.error);
        }
      } catch {
        setPromoCodeDiscount(0);
        setPromoCodeMessage(undefined);
        setPromoCodeError("Failed to validate promo code.");
      } finally {
        setIsValidatingPromoCode(false);
      }
    }, 800);

    return () => {
      if (promoValidationTimeoutRef.current) {
        clearTimeout(promoValidationTimeoutRef.current);
      }
    };
  }, [promoCode, items, orderDiscount, store.storeId]);

  useEffect(() => {
    if (isReceiptOpen || !receipt) return;

    const timer = window.setTimeout(() => {
      setReceipt(null);
    }, RECEIPT_CLOSE_ANIMATION_MS);

    return () => window.clearTimeout(timer);
  }, [isReceiptOpen, receipt]);

  const subtotalAmount = subtotal();
  const itemDiscountAmount = itemDiscountTotal();
  const discountBeforeTax = Math.max(
    0,
    itemDiscountAmount + orderDiscount + promoCodeDiscount,
  );
  const taxableBase = Math.max(0, subtotalAmount - discountBeforeTax);
  const taxAmount = Number(
    (taxableBase * (store.taxRate / 100)).toFixed(
      store.currency.currency_decimals,
    ),
  );
  const payable = Math.max(0, taxableBase + taxAmount);

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

  const totalCartItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = () => {
    setIsMobileCartOpen(false);
    setIsPaymentOpen(true);
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
    <section className="grid gap-4 pb-24 lg:h-full lg:grid-cols-[1.55fr_0.7fr] lg:pb-0">
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
        className="hidden lg:flex"
        currency={store.currency}
        items={items}
        subtotal={subtotalAmount}
        itemDiscountTotal={itemDiscountAmount}
        orderDiscount={orderDiscount}
        promoCode={promoCode}
        promoCodeDiscount={promoCodeDiscount}
        promoCodeMessage={promoCodeMessage}
        promoCodeError={promoCodeError}
        isValidatingPromoCode={isValidatingPromoCode}
        availablePromotions={availablePromotions}
        taxAmount={taxAmount}
        onClearAll={clearCart}
        onCheckout={handleCheckout}
        onQuantityChange={setQuantity}
        onItemDiscountChange={setItemDiscount}
        onOrderDiscountChange={setOrderDiscount}
        onPromoCodeChange={setPromoCode}
        onRemove={handleRemoveItem}
        total={payable}
        products={products}
      />

      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 backdrop-blur lg:hidden",
          "px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3",
          "ml-0 md:ml-16",
          "border-t border-border bg-white/95",
        )}
      >
        <Button
          type="button"
          variant="primary"
          className="flex w-full items-center justify-between"
          onClick={() => setIsMobileCartOpen(true)}
          icon={<ChevronUp size={16} />}
        >
          <span className="inline-flex items-center gap-2">
            <ShoppingCart size={16} />
            Cart ({totalCartItems})
          </span>
          <span className="font-semibold">
            {formatCurrency(payable, store.currency)}
          </span>
        </Button>
      </div>

      <Drawer
        open={isMobileCartOpen}
        onClose={() => setIsMobileCartOpen(false)}
        side="bottom"
        size="2xl"
        className={cn("lg:hidden")}
      >
        <DrawerHeader
          title="Your cart"
          onClose={() => setIsMobileCartOpen(false)}
        />
        <DrawerBody className="p-3">
          <CartPanel
            className="h-full rounded-xl min-h-96"
            currency={store.currency}
            items={items}
            subtotal={subtotalAmount}
            itemDiscountTotal={itemDiscountAmount}
            orderDiscount={orderDiscount}
            promoCode={promoCode}
            promoCodeDiscount={promoCodeDiscount}
            promoCodeMessage={promoCodeMessage}
            promoCodeError={promoCodeError}
            isValidatingPromoCode={isValidatingPromoCode}
            availablePromotions={availablePromotions}
            taxAmount={taxAmount}
            onClearAll={clearCart}
            onCheckout={handleCheckout}
            onQuantityChange={setQuantity}
            onItemDiscountChange={setItemDiscount}
            onOrderDiscountChange={setOrderDiscount}
            onPromoCodeChange={setPromoCode}
            onRemove={handleRemoveItem}
            total={payable}
            products={products}
          />
        </DrawerBody>
      </Drawer>

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
              orderDiscount,
              promoCode: promoCode || undefined,
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
          taxAmount={receipt.taxAmount}
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

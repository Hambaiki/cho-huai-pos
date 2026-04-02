"use client";

import { Button } from "@/components/ui/Button";
import { FormInput, FormLabel } from "@/components/ui/form";
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/Modal";
import type { PosProduct } from "@/features/pos/components/ProductGrid";
import { type CartItem } from "@/features/pos/store/cart";
import { cn } from "@/lib/utils/cn";
import { formatCurrency, type CurrencyStore } from "@/lib/utils/currency";
import {
  AlertCircle,
  Barcode,
  ChevronDown,
  ChevronUp,
  Check,
  ImageOff,
  Minus,
  Plus,
  ShoppingCart,
  Trash,
} from "lucide-react";
import { useState } from "react";

interface AvailablePromotion {
  code: string | null;
  name: string;
  isAutomatic: boolean;
}

interface CartPanelProps {
  items: CartItem[];
  currency: CurrencyStore;
  subtotal: number;
  itemDiscountTotal: number;
  orderDiscount: number;
  promoCode: string;
  promoCodeDiscount?: number;
  promoCodeMessage?: string;
  promoCodeError?: string;
  isValidatingPromoCode?: boolean;
  availablePromotions?: AvailablePromotion[];
  taxAmount: number;
  total: number;
  onQuantityChange: (productId: string, quantity: number) => void;
  onItemDiscountChange: (productId: string, discount: number) => void;
  onOrderDiscountChange: (discount: number) => void;
  onPromoCodeChange: (promoCode: string) => void;
  onRemove: (productId: string) => void;
  onClearAll: () => void;
  onCheckout: () => void;
  onScanProduct?: () => void;
  products?: PosProduct[];
  className?: string;
}

export function CartPanel({
  items,
  currency,
  subtotal,
  itemDiscountTotal,
  orderDiscount,
  promoCode,
  promoCodeDiscount = 0,
  promoCodeMessage,
  promoCodeError,
  isValidatingPromoCode = false,
  availablePromotions = [],
  taxAmount,
  total,
  onQuantityChange,
  onItemDiscountChange,
  onOrderDiscountChange,
  onPromoCodeChange,
  onRemove,
  onClearAll,
  onCheckout,
  onScanProduct,
  products = [],
  className,
}: CartPanelProps) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isManualDiscountOpen, setIsManualDiscountOpen] = useState(false);
  const [expandedItemDiscounts, setExpandedItemDiscounts] = useState<
    Record<string, boolean>
  >({});
  const promoCodesFinal = availablePromotions.filter((p) => !p.isAutomatic);

  const toggleItemDiscountEditor = (productId: string) => {
    setExpandedItemDiscounts((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  return (
    <>
      <aside
        className={cn(
          "flex flex-col h-full rounded-2xl border border-border bg-surface",
          className,
        )}
      >
        <div className="flex items-center justify-between border-b border-border p-3">
          <h2 className="inline-flex items-center text-lg font-semibold text-neutral-900">
            <ShoppingCart size={16} className="mr-2" />
            Cart ({items.reduce((sum, item) => sum + item.quantity, 0)})
          </h2>
          <div className="flex items-center gap-2">
            {onScanProduct && products.length > 0 && (
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => onScanProduct()}
                title="Scan barcode with camera to add product"
                icon={<Barcode size={16} />}
              >
                Scan product
              </Button>
            )}
          </div>
        </div>

        <div className={cn("min-h-0 flex-1 overflow-y-auto pr-1 lg:block")}>
          <div className="p-3">
            {items.length === 0 ? (
              <p className="text-sm text-neutral-500">No items yet.</p>
            ) : (
              items.map((item) => (
                <article
                  key={item.productId}
                  className="mb-3 rounded-xl border border-border p-3 last:mb-0"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md border border-neutral-200 bg-neutral-50">
                        {item.imageUrl ? (
                          <div
                            className="h-full w-full bg-contain bg-center bg-no-repeat"
                            style={{ backgroundImage: `url(${item.imageUrl})` }}
                          />
                        ) : (
                          <div className="flex flex-col h-full w-full items-center justify-center text-[10px] font-medium text-neutral-500">
                            <ImageOff size={12} />
                            No image
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-medium text-neutral-900">
                          {item.name}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {formatCurrency(item.unitPrice, currency)} each
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemove(item.productId)}
                      type="button"
                      icon={<Trash size={16} />}
                      className="p-1 text-xs font-medium text-danger-700 hover:text-danger-600"
                    >
                      Remove
                    </Button>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() =>
                          onQuantityChange(item.productId, item.quantity - 1)
                        }
                        type="button"
                        icon={<Minus size={16} />}
                      ></Button>
                      <span className="w-8 text-center text-sm">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() =>
                          onQuantityChange(item.productId, item.quantity + 1)
                        }
                        type="button"
                        icon={<Plus size={16} />}
                      ></Button>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-neutral-900">
                        {formatCurrency(
                          item.unitPrice * item.quantity,
                          currency,
                        )}
                      </p>
                      {item.discount > 0 ? (
                        <p className="text-xs text-danger-600">
                          -
                          {formatCurrency(
                            item.discount * item.quantity,
                            currency,
                          )}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-2 rounded-md bg-neutral-50 px-2 py-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-neutral-500">
                        {item.discount > 0
                          ? `Item discount: ${formatCurrency(item.discount, currency)} / unit`
                          : "No item discount"}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        className="h-auto px-1.5 py-0.5 text-xs"
                        onClick={() => toggleItemDiscountEditor(item.productId)}
                      >
                        {expandedItemDiscounts[item.productId] || item.discount > 0
                          ? "Hide"
                          : "Add"}
                      </Button>
                    </div>

                    {(expandedItemDiscounts[item.productId] || item.discount > 0) && (
                      <div className="mt-2">
                        <FormLabel
                          htmlFor={`item-discount-${item.productId}`}
                          className="mb-1 block text-xs text-neutral-500"
                        >
                          Item discount (per unit)
                        </FormLabel>
                        <FormInput
                          id={`item-discount-${item.productId}`}
                          type="number"
                          inputMode="decimal"
                          min={0}
                          max={item.unitPrice}
                          step="0.01"
                          value={item.discount}
                          onChange={(event) => {
                            const raw = Number(event.target.value);
                            onItemDiscountChange(
                              item.productId,
                              Number.isFinite(raw) ? raw : 0,
                            );
                          }}
                          className="w-full rounded-md border border-border px-2 py-1.5 text-sm"
                        />
                      </div>
                    )}
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <div className={cn("p-3", "border-t border-border lg:block")}>
          <div className="mb-3 overflow-hidden rounded-lg border border-border">
            <button
              type="button"
              className="flex w-full items-center justify-between bg-neutral-50 px-3 py-2 text-left"
              onClick={() => setIsManualDiscountOpen((prev) => !prev)}
            >
              <span className="text-sm font-medium text-neutral-900">
                Cashier discounts (optional)
              </span>
              {isManualDiscountOpen ? (
                <ChevronUp size={16} className="text-neutral-500" />
              ) : (
                <ChevronDown size={16} className="text-neutral-500" />
              )}
            </button>

            {isManualDiscountOpen ? (
              <div className="border-t border-border px-3 py-3">
                <div className="mb-2 flex items-center justify-between">
                  <FormLabel
                    htmlFor="order-discount"
                    className="mb-0 block text-xs text-neutral-500"
                  >
                    Order discount
                  </FormLabel>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onOrderDiscountChange(0)}
                    type="button"
                    disabled={orderDiscount === 0}
                    className="h-auto px-1.5 py-0.5 text-xs text-danger-700"
                  >
                    Clear
                  </Button>
                </div>

                <FormInput
                  id="order-discount"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  value={orderDiscount}
                  onChange={(event) => {
                    const raw = Number(event.target.value);
                    onOrderDiscountChange(Number.isFinite(raw) ? raw : 0);
                  }}
                  className="w-full rounded-md border border-border px-2 py-1.5 text-sm"
                />
              </div>
            ) : null}
          </div>

          <div className="mb-3">
            <div className="mb-1 flex items-center justify-between gap-2">
              <FormLabel
                htmlFor="promo-code"
                className="mb-0 block text-xs text-neutral-500"
              >
                Promo code {isValidatingPromoCode && <span className="text-xs text-neutral-400">(validating...)</span>}
              </FormLabel>
              {promoCode ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto px-1.5 py-0.5 text-xs text-danger-700"
                  onClick={() => onPromoCodeChange("")}
                  disabled={isValidatingPromoCode}
                >
                  Remove code
                </Button>
              ) : null}
            </div>
            <FormInput
              id="promo-code"
              type="text"
              value={promoCode}
              onChange={(event) => onPromoCodeChange(event.target.value)}
              placeholder="e.g. SAVE10"
              disabled={isValidatingPromoCode}
              className="w-full rounded-md border border-border px-2 py-1.5 text-sm uppercase"
            />
            {promoCodeError && (
              <div className="mt-1.5 flex items-start gap-2 rounded-md bg-danger-50 p-2">
                <AlertCircle size={14} className="mt-0.5 shrink-0 text-danger-600" />
                <p className="text-xs text-danger-600">{promoCodeError}</p>
              </div>
            )}
            {promoCodeMessage && !promoCodeError && (
              <div className="mt-1.5 flex items-start gap-2 rounded-md bg-success-50 p-2">
                <Check size={14} className="mt-0.5 shrink-0 text-success-600" />
                <p className="text-xs text-success-600">{promoCodeMessage}</p>
              </div>
            )}
            {promoCodesFinal.length > 0 && !promoCode && (
              <p className="mt-1.5 text-xs text-neutral-500">
                Available codes: {promoCodesFinal.map((p) => p.code).join(", ")}
              </p>
            )}
          </div>

          <div className="space-y-1.5 text-sm">
            <div className="flex items-center justify-between text-neutral-600">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal, currency)}</span>
            </div>
            {itemDiscountTotal > 0 ? (
              <div className="flex items-center justify-between text-danger-600">
                <span>Item discounts</span>
                <span>-{formatCurrency(itemDiscountTotal, currency)}</span>
              </div>
            ) : null}
            {orderDiscount > 0 ? (
              <div className="flex items-center justify-between text-danger-600">
                <span>Order discount</span>
                <span>-{formatCurrency(orderDiscount, currency)}</span>
              </div>
            ) : null}
            {promoCodeDiscount > 0 ? (
              <div className="flex items-center justify-between text-success-600">
                <span>Promo discount</span>
                <span>-{formatCurrency(promoCodeDiscount, currency)}</span>
              </div>
            ) : null}
            <div className="flex items-center justify-between text-neutral-600">
              <span>Tax</span>
              <span>{formatCurrency(taxAmount, currency)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-600">Total</span>
            <strong className="text-neutral-900">
              {formatCurrency(total, currency)}
            </strong>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="w-full"
              disabled={items.length === 0}
              onClick={() => setShowClearConfirm(true)}
              type="button"
            >
              Clear all
            </Button>
            <Button
              className="w-full"
              disabled={items.length === 0}
              onClick={onCheckout}
              type="button"
            >
              Checkout
            </Button>
          </div>
        </div>
      </aside>

      <Modal
        open={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        size="sm"
      >
        <ModalHeader
          title="Clear cart"
          description="Remove all items from this cart?"
          onClose={() => setShowClearConfirm(false)}
        />
        <ModalBody>
          <p className="text-sm text-neutral-600">
            This action cannot be undone.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowClearConfirm(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              onClearAll();
              setShowClearConfirm(false);
            }}
          >
            Clear all
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}

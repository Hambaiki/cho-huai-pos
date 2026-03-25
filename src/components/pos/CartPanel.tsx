"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils/currency";
import { type CurrencyStore } from "@/lib/utils/currency";
import { type CartItem } from "@/lib/store/cart";
import { cn } from "@/lib/utils/cn";
import { ShoppingCart, Trash } from "lucide-react";
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/Modal";

interface CartPanelProps {
  items: CartItem[];
  currency: CurrencyStore;
  total: number;
  onQuantityChange: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  onClearAll: () => void;
  onCheckout: () => void;
  className?: string;
}

export function CartPanel({
  items,
  currency,
  total,
  onQuantityChange,
  onRemove,
  onClearAll,
  onCheckout,
  className,
}: CartPanelProps) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  return (
    <>
      <aside
        className={cn(
          "flex h-full min-h-0 flex-col rounded-2xl border border-border bg-surface",
          className,
        )}
      >
        <h2 className="inline-flex items-center text-lg font-semibold text-neutral-900 border-b border-border p-4">
          <ShoppingCart size={16} className="mr-2" />
          Cart
        </h2>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="p-4">
            {items.length === 0 ? (
              <p className="text-sm text-neutral-500">No items yet.</p>
            ) : (
              items.map((item) => (
                <article
                  key={item.productId}
                  className="mb-3 rounded-xl border border-border p-3 last:mb-0"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-neutral-900">
                        {item.name}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {formatCurrency(item.unitPrice, currency)} each
                      </p>
                    </div>
                    <button
                      className="flex items-center gap-1 text-xs font-medium text-danger-700 transition hover:text-danger-600"
                      onClick={() => onRemove(item.productId)}
                      type="button"
                    >
                      <Trash size={16} />
                      Remove
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        className="h-7 w-7 rounded-md border border-border text-sm"
                        onClick={() =>
                          onQuantityChange(item.productId, item.quantity - 1)
                        }
                        type="button"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm">
                        {item.quantity}
                      </span>
                      <button
                        className="h-7 w-7 rounded-md border border-border text-sm"
                        onClick={() =>
                          onQuantityChange(item.productId, item.quantity + 1)
                        }
                        type="button"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-sm font-semibold text-neutral-900">
                      {formatCurrency(item.unitPrice * item.quantity, currency)}
                    </p>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="border-t border-border p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-600">Total</span>
            <strong className="text-neutral-900">
              {formatCurrency(total, currency)}
            </strong>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              className="w-full rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={items.length === 0}
              onClick={() => setShowClearConfirm(true)}
              type="button"
            >
              Clear all
            </button>
            <button
              className="w-full rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={items.length === 0}
              onClick={onCheckout}
              type="button"
            >
              Checkout
            </button>
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
          <button
            type="button"
            onClick={() => setShowClearConfirm(false)}
            className="rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onClearAll();
              setShowClearConfirm(false);
            }}
            className="rounded-md bg-danger-600 px-3 py-2 text-sm font-medium text-white hover:bg-danger-700"
          >
            Clear all
          </button>
        </ModalFooter>
      </Modal>
    </>
  );
}

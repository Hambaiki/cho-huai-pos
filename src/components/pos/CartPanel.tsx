"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils/currency";
import { type CurrencyStore } from "@/lib/utils/currency";
import { type CartItem } from "@/lib/store/cart";
import { cn } from "@/lib/utils/cn";
import { Minus, Plus, ShoppingCart, Trash } from "lucide-react";
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

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

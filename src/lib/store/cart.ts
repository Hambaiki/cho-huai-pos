import { create } from "zustand";

export interface CartItem {
  productId: string;
  name: string;
  unitPrice: number;
  stockQty: number;
  quantity: number;
  discount: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity" | "discount">) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: () => number;
  totalDiscount: () => number;
  total: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  addItem: (item) => {
    set((state) => {
      const existing = state.items.find((i) => i.productId === item.productId);

      if (!existing) {
        return {
          items: [
            ...state.items,
            {
              ...item,
              quantity: 1,
              discount: 0,
            },
          ],
        };
      }

      const nextQty = Math.min(existing.quantity + 1, existing.stockQty);

      return {
        items: state.items.map((i) =>
          i.productId === item.productId ? { ...i, quantity: nextQty } : i,
        ),
      };
    });
  },
  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter((item) => item.productId !== productId),
    }));
  },
  setQuantity: (productId, quantity) => {
    set((state) => ({
      items: state.items.map((item) => {
        if (item.productId !== productId) {
          return item;
        }

        const safeQty = Math.max(1, Math.min(quantity, item.stockQty));
        return { ...item, quantity: safeQty };
      }),
    }));
  },
  clearCart: () => set({ items: [] }),
  subtotal: () =>
    get().items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
  totalDiscount: () =>
    get().items.reduce((sum, item) => sum + item.discount * item.quantity, 0),
  total: () => {
    const subtotal = get().subtotal();
    const discount = get().totalDiscount();
    return Math.max(0, subtotal - discount);
  },
}));

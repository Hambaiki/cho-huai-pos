"use client";

import { DEFAULT_CURRENCY, type CurrencyStore } from "@/lib/utils/currency";
import { createContext, useContext } from "react";

export type MemberRole = "owner" | "manager" | "cashier" | "viewer";

export interface StoreContextValue {
  storeId: string;
  storeName: string;
  role: MemberRole;
  currency: CurrencyStore;
}

const StoreContext = createContext<StoreContextValue | null>(null);

interface StoreProviderProps {
  value: StoreContextValue;
  children: React.ReactNode;
}

export function StoreProvider({ value, children }: StoreProviderProps) {
  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStoreContext() {
  const context = useContext(StoreContext);

  if (!context) {
    return {
      storeId: "",
      storeName: "",
      role: "viewer" as MemberRole,
      currency: DEFAULT_CURRENCY,
    };
  }

  return context;
}

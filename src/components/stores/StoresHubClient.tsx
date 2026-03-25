"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CirclePlus, ShieldAlert, Store } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { CreateStoreModal } from "./CreateStoreModal";

interface StoreItem {
  id: string;
  name: string;
  address: string | null;
  isSuspended: boolean;
  createdAt: string;
  role: "owner" | "manager" | "cashier" | "viewer";
}

interface StoresHubClientProps {
  stores: StoreItem[];
}

const ROLE_CLASSES: Record<string, string> = {
  owner: "bg-brand-100 text-brand-700",
  manager: "bg-info-100 text-info-700",
  cashier: "bg-success-100 text-success-700",
  viewer: "bg-neutral-100 text-neutral-600",
};

export function StoresHubClient({ stores }: StoresHubClientProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Your Stores"
        description={
          stores.length === 0
            ? "No stores yet — create one to get started."
            : `${stores.length} store${stores.length > 1 ? "s" : ""} available`
        }
        actions={
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
          >
            <CirclePlus size={16} />
            New Store
          </button>
        }
      />

      {stores.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100">
            <Store className="h-7 w-7 text-neutral-400" />
          </div>
          <h3 className="text-base font-semibold text-neutral-700">No stores yet</h3>
          <p className="mt-1 text-sm text-neutral-500">
            Create your first store to start managing products and sales.
          </p>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
          >
            <CirclePlus size={16} />
            Create your first store
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stores.map((store) => (
            <article
              key={store.id}
              className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-5 transition"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50">
                  <Store className="h-5 w-5 text-brand-600" />
                </div>
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                    ROLE_CLASSES[store.role] ?? "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {store.role}
                </span>
              </div>

              <div className="mt-3 flex-1">
                <h3 className="font-semibold text-neutral-900">{store.name}</h3>
                {store.address ? (
                  <p className="mt-1 line-clamp-2 text-sm text-neutral-500">{store.address}</p>
                ) : (
                  <p className="mt-1 text-sm text-neutral-400 italic">No address</p>
                )}
                {store.isSuspended && (
                  <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-warning-100 px-2 py-0.5 text-xs font-medium text-warning-700">
                    <ShieldAlert size={14} />
                    Suspended by Admin
                  </p>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-4">
                <span className="text-xs text-neutral-400">
                  {new Date(store.createdAt).toLocaleDateString()}
                </span>
                {store.isSuspended ? (
                  <span className="rounded-lg bg-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-500">
                    Disabled
                  </span>
                ) : (
                  <Link
                    href={`/dashboard/store/${store.id}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-700"
                  >
                    Open workspace
                    <ArrowRight size={14} />
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <CreateStoreModal open={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
}

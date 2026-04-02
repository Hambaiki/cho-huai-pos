"use client";

import { PageHeader } from "@/components/content/PageHeader";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import { ArrowRight, CirclePlus, ShieldAlert, Store } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { StoreItem } from "../types";
import { CreateStoreModal } from "./CreateStoreModal";

interface StoresHubClientProps {
  stores: StoreItem[];
}

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
          <Button
            icon={<CirclePlus size={16} />}
            onClick={() => setIsCreateOpen(true)}
          >
            New Store
          </Button>
        }
      />

      {stores.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100">
            <Store className="h-7 w-7 text-neutral-400" />
          </div>
          <h3 className="text-base font-semibold text-neutral-700">
            No stores yet
          </h3>
          <p className="mt-1 text-sm text-neutral-500">
            Create your first store to start managing products and sales.
          </p>
          <Button
            size="lg"
            icon={<CirclePlus size={16} />}
            onClick={() => setIsCreateOpen(true)}
            className="mt-5"
          >
            Create your first store
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stores.map((store) => (
            <article
              key={store.id}
              className="flex flex-col rounded-2xl border border-neutral-200 bg-white transition"
            >
              <div className="flex items-start justify-between gap-2 p-4 pb-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50">
                  <Store className="h-5 w-5 text-brand-600" />
                </div>
                <span
                  className={cn(
                    `inline-block rounded-full px-3 py-1 text-xs font-medium capitalize`,
                    "bg-neutral-100 text-neutral-600",
                    store.role == "owner" && "bg-brand-100 text-brand-700",
                    store.role == "manager" && "bg-info-100 text-info-700",
                    store.role == "cashier" &&
                      "bg-success-100 text-success-700",
                  )}
                >
                  {store.role}
                </span>
              </div>

              <div className="mt-3 flex-1 px-4">
                <h3 className="font-semibold text-neutral-900">{store.name}</h3>
                {store.address ? (
                  <p className="mt-1 line-clamp-2 text-sm text-neutral-500">
                    {store.address}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-neutral-400 italic">
                    No address
                  </p>
                )}
                {store.isSuspended && (
                  <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-warning-100 px-2 py-1 text-xs font-medium text-warning-700">
                    <ShieldAlert size={14} />
                    Suspended by Admin
                  </p>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-neutral-100 p-4">
                <span className="text-xs text-neutral-400">
                  {new Date(store.createdAt).toLocaleDateString()}
                </span>
                {store.isSuspended ? (
                  <span className="rounded-lg bg-neutral-200 px-3 py-2 text-xs font-medium text-neutral-500">
                    Disabled
                  </span>
                ) : (
                  <Link
                    href={`/dashboard/store/${store.id}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-brand-700"
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

      <CreateStoreModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  );
}

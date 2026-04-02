"use client";

import { PageHeader } from "@/components/content/PageHeader";
import {
  SectionCard,
  SectionCardBody,
  SectionCardHeader,
} from "@/components/content/SectionCard";
import { Button } from "@/components/ui/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import type { StoreMemberRole } from "@/features/settings/types";
import { useSyncPendingAction } from "@/features/shell/pending/PendingActionProvider";
import { toast } from "@/features/shell/toaster/toaster";
import { cn } from "@/lib/utils/cn";
import { formatCurrency, type CurrencyStore } from "@/lib/utils/currency";
import { Pause, Play, Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { togglePromotionStatusAction } from "../actions";
import type { StorePromotionRow } from "../types";
import CreatePromotionModal from "./CreatePromotionModal";

interface PromotionsManagerProps {
  storeId: string;
  role: StoreMemberRole;
  currency: CurrencyStore;
  promotions: StorePromotionRow[];
}

export function PromotionsManager({
  storeId,
  role,
  currency,
  promotions,
}: PromotionsManagerProps) {
  const canManage = role === "owner" || role === "manager";

  const [isPending, startTransition] = useTransition();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  function handleError(message: string) {
    toast.error(message);
  }

  useSyncPendingAction(isPending, {
    message: "Saving promotion...",
  });

  return (
    <section className="space-y-6">
      <PageHeader
        title="Promotions"
        description="Manage promo codes and automatic discount rules"
        actions={
          <Button
            icon={<Plus size={16} />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            New Promotion
          </Button>
        }
      />

      {canManage && (
        <CreatePromotionModal
          storeId={storeId}
          open={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}

      <SectionCard>
        <SectionCardHeader title="Promotions" />
        {promotions.length === 0 ? (
          <SectionCardBody className="text-sm text-neutral-500">
            No promotions yet. Create one to enable promo codes or automatic
            discounts.
          </SectionCardBody>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-full text-sm">
              <TableHeader>
                <TableRow className="border-b border-border text-left text-neutral-500">
                  <TableHead className="py-2 pr-3">Name</TableHead>
                  <TableHead className="py-2 pr-3">Code</TableHead>
                  <TableHead className="py-2 pr-3">Mode</TableHead>
                  <TableHead className="py-2 pr-3">Value</TableHead>
                  <TableHead className="py-2 pr-3">Min total</TableHead>
                  <TableHead className="py-2 pr-3">Usage limit</TableHead>
                  <TableHead className="py-2 pr-3">Status</TableHead>
                  <TableHead className="py-2 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promotions.map((promotion) => (
                  <TableRow
                    key={promotion.id}
                    className="border-b border-border/60"
                  >
                    <TableCell className="py-2 pr-3 font-medium text-neutral-900">
                      {promotion.name}
                    </TableCell>
                    <TableCell className="py-2 pr-3 uppercase">
                      <span className="font-semibold bg-neutral-500 text-white px-2 py-1 rounded">
                        {promotion.code ?? "-"}
                      </span>
                    </TableCell>
                    <TableCell className="py-2 pr-3">
                      {promotion.applies_automatically ? "Automatic" : "Manual"}
                    </TableCell>
                    <TableCell className="py-2 pr-3">
                      {promotion.type === "percentage"
                        ? `${Number(promotion.value)}%`
                        : formatCurrency(Number(promotion.value), currency)}
                    </TableCell>
                    <TableCell className="py-2 pr-3">
                      {formatCurrency(
                        Number(promotion.min_order_total),
                        currency,
                      )}
                    </TableCell>
                    <TableCell className="py-2 pr-3">
                      {promotion.max_redemptions ?? "Unlimited"}
                    </TableCell>
                    <TableCell className="py-2 pr-3">
                      <span
                        className={cn(
                          `text-xs font-semibold px-2 py-1 rounded-full`,
                          promotion.is_active
                            ? "bg-success-100 text-success-700"
                            : "bg-neutral-100 text-neutral-500",
                        )}
                      >
                        {promotion.is_active ? "Active" : "Paused"}
                      </span>
                    </TableCell>
                    <TableCell className="py-2 text-right">
                      {canManage ? (
                        <Button
                          type="button"
                          variant={promotion.is_active ? "warning" : "primary"}
                          icon={
                            promotion.is_active ? (
                              <Pause size={16} />
                            ) : (
                              <Play size={16} />
                            )
                          }
                          size="sm"
                          disabled={isPending}
                          onClick={() => {
                            startTransition(async () => {
                              const result = await togglePromotionStatusAction({
                                promotionId: promotion.id,
                                storeId,
                                isActive: !promotion.is_active,
                              });
                              if (result.error) {
                                handleError(result.error);
                              }
                            });
                          }}
                        >
                          {promotion.is_active ? "Pause" : "Activate"}
                        </Button>
                      ) : (
                        <span className="text-xs text-neutral-500">
                          View only
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>
    </section>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateBnplAccountStatusAction } from "@/lib/actions/bnpl";
import type { BnplActionResult } from "@/lib/actions/bnpl";
import { FormSelect, FormSelectOption } from "../ui/form";
import { useSyncPendingAction } from "../ui/PendingActionProvider";

const STATUS_OPTIONS = ["active", "frozen", "closed", "settled"] as const;
type AccountStatus = (typeof STATUS_OPTIONS)[number];

export default function AccountStatusControl({
  accountId,
  storeId,
  currentStatus,
}: {
  accountId: string;
  storeId: string;
  currentStatus: AccountStatus;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useSyncPendingAction(isPending, {
    message: "Updating account status…",
  });

  function handleChange(status: string) {
    const newStatus = status as AccountStatus;
    setError(null);
    startTransition(async () => {
      const result: BnplActionResult = await updateBnplAccountStatusAction(
        accountId,
        storeId,
        newStatus,
      );
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <FormSelect
        value={currentStatus}
        onChange={handleChange}
        disabled={isPending}
        className="w-36"
      >
        {STATUS_OPTIONS.map((s) => (
          <FormSelectOption key={s} value={s}>
            <span className="capitalize">{s}</span>
          </FormSelectOption>
        ))}
      </FormSelect>
      {error && <span className="text-xs text-danger-600">{error}</span>}
    </div>
  );
}

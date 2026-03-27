"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { setStoreStaffLimitOverrideAction } from "@/lib/actions/admin";
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useSyncPendingAction } from "../ui/PendingActionProvider";
import { FormInput } from "../ui/form";

interface StaffLimitModalProps {
  open: boolean;
  onClose: () => void;
  store: {
    id: string;
    name: string;
    staff_limit_override: number | null;
  };
}

export function StaffLimitModal({
  open,
  onClose,
  store,
}: StaffLimitModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [staffLimitDraftByStore, setStaffLimitDraftByStore] = useState<
    Record<string, string>
  >({});
  const [error, setError] = useState<string | null>(null);

  useSyncPendingAction(isPending, {
    message: "Updating staff limit...",
    subMessage:
      "This may take a moment. Please do not close or refresh the page.",
  });

  const defaultStaffLimitInput = store.staff_limit_override
    ? String(store.staff_limit_override)
    : "";
  const staffLimitInput =
    staffLimitDraftByStore[store.id] ?? defaultStaffLimitInput;

  const handleClose = () => {
    setStaffLimitDraftByStore((current) => {
      if (!(store.id in current)) {
        return current;
      }

      const next = { ...current };
      delete next[store.id];
      return next;
    });
    setError(null);
    onClose();
  };

  const handleConfirm = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("storeId", store.id);
      formData.set("staffLimitOverride", staffLimitInput.trim());

      const result = await setStoreStaffLimitOverrideAction(formData);

      if (!result.ok) {
        setError(result.error ?? "Unable to update store status.");
        return;
      }

      handleClose();
      router.refresh();
    });
  };

  return (
    <>
      <Modal open={open} onClose={handleClose} size="md">
        <ModalHeader title="Update Staff Limit" onClose={handleClose} />
        <ModalBody>
          <div className="space-y-3">
            <p className="text-sm text-neutral-600">
              Set a staff limit override for this store. Leave the field empty
              to use the global default from site settings.
            </p>
            <FormInput
              type="number"
              min={1}
              step={1}
              value={staffLimitInput}
              onChange={(event) => {
                setStaffLimitDraftByStore((current) => ({
                  ...current,
                  [store.id]: event.target.value,
                }));
                setError(null);
              }}
              placeholder="Use default"
            />
          </div>
          {error && <p className="mt-3 text-sm text-danger-700">{error}</p>}
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="button" isLoading={isPending} onClick={handleConfirm}>
            {isPending ? "Saving..." : "Confirm"}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}

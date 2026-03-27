"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setStoreSuspensionAction } from "@/lib/actions/admin";
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useSyncPendingAction } from "@/components/ui/PendingActionProvider";

interface SuspendStoreModalProps {
  open: boolean;
  onClose: () => void;
  store: {
    id: string;
    name: string;
    is_suspended: boolean;
  };
  nextValue: boolean;
}

export function SuspendStoreModal({
  open,
  onClose,
  store,
  nextValue,
}: SuspendStoreModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  useSyncPendingAction(isPending, {
    message: "Updating store suspension status...",
    subMessage:
      "This may take a moment. Please do not close or refresh the page.",
  });

  const handleConfirm = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("storeId", store.id);
      formData.set("suspend", String(nextValue));

      const result = await setStoreSuspensionAction(formData);

      if (result.ok) {
        onClose();
        router.refresh();
      }
    });
  };

  return (
    <>
      <Modal open={open} onClose={onClose} size="md">
        <ModalHeader
          title={nextValue ? "Disable Store" : "Enable Store"}
          onClose={onClose}
        />
        <ModalBody>
          <p className="text-sm text-neutral-600">
            {nextValue
              ? "Disabling this store blocks members from accessing its workspace routes."
              : "Enabling this store will allow members to access all store routes again."}
          </p>
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose}>
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

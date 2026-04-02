"use client";

import { Button } from "@/components/ui/Button";
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/Modal";
import { setUserSuspensionAction } from "@/features/admin/actions";
import { useSyncPendingAction } from "@/features/shell/pending/PendingActionProvider";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { AdminProfile } from "../types";

interface SuspendUserModalProps {
  open: boolean;
  onClose: () => void;
  profile: Pick<AdminProfile, "id" | "display_name" | "is_suspended">;
  nextValue: boolean;
}

export function SuspendUserModal({
  open,
  onClose,
  profile,
  nextValue,
}: SuspendUserModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  useSyncPendingAction(isPending, {
    message: "Updating user suspension status...",
    subMessage:
      "This may take a moment. Please do not close or refresh the page.",
  });

  const handleConfirm = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("userId", profile.id);
      formData.set("suspend", String(nextValue));

      const result = await setUserSuspensionAction(formData);

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
          title={nextValue ? "Suspend User" : "Approve User Access"}
          onClose={onClose}
        />
        <ModalBody>
          <p className="text-sm text-neutral-600">
            {nextValue
              ? "This user will be redirected to Access Pending and blocked from normal app routes."
              : "This user will regain access to the application."}
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

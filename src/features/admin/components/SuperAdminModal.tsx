"use client";

import { Button } from "@/components/ui/Button";
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/Modal";
import { setUserSuperAdminAction } from "@/features/admin/actions";
import { useSyncPendingAction } from "@/features/shell/pending/PendingActionProvider";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { AdminProfile } from "../types";

interface SuperAdminModalProps {
  open: boolean;
  onClose: () => void;
  profile: Pick<AdminProfile, "id" | "display_name" | "is_super_admin">;
  nextValue: boolean;
}

export function SuperAdminModal({
  open,
  onClose,
  profile,
  nextValue,
}: SuperAdminModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  useSyncPendingAction(isPending, {
    message: "Updating super admin status...",
    subMessage:
      "This may take a moment. Please do not close or refresh the page.",
  });

  const handleConfirm = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("userId", profile.id);
      formData.set("makeSuperAdmin", String(nextValue));

      const result = await setUserSuperAdminAction(formData);

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
          title={nextValue ? "Grant Super Admin" : "Revoke Super Admin"}
          onClose={onClose}
        />
        <ModalBody>
          <p className="text-sm text-neutral-600">
            {nextValue
              ? "This user will gain access to all superadmin routes and actions."
              : "This user will lose superadmin access and admin route privileges."}
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

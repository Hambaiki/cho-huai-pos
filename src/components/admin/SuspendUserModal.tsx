"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setUserSuspensionAction } from "@/lib/actions/admin";
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface SuspendUserModalProps {
  open: boolean;
  onClose: () => void;
  profile: {
    id: string;
    display_name: string | null;
    is_suspended: boolean;
  };
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
  );
}

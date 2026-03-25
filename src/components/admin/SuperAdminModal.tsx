"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setUserSuperAdminAction } from "@/lib/actions/admin";
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface SuperAdminModalProps {
  open: boolean;
  onClose: () => void;
  profile: {
    id: string;
    display_name: string | null;
    is_super_admin: boolean;
  };
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
  );
}

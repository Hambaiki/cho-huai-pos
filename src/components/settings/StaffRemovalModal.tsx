"use client";

import { Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface StaffRemovalModalProps {
  open: boolean;
  memberName: string;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function StaffRemovalModal({
  open,
  memberName,
  isPending,
  onClose,
  onConfirm,
}: StaffRemovalModalProps) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <ModalHeader
        title="Remove staff member"
        description={`Remove ${memberName} from this store?`}
        onClose={onClose}
      />
      <ModalBody>
        <p className="text-sm text-neutral-600">
          This person will lose access immediately. This action cannot be undone.
        </p>
      </ModalBody>
      <ModalFooter>
        <Button
          type="button"
          onClick={onClose}
          disabled={isPending}
          variant="outline"
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={onConfirm}
          disabled={isPending}
          variant="destructive"
          isLoading={isPending}
        >
          {isPending ? "Removing..." : "Remove"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

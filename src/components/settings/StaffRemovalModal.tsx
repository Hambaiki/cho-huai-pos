"use client";

import { Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/ui/Modal";

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
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isPending}
          className="rounded-md bg-danger-600 px-3 py-2 text-sm font-medium text-white hover:bg-danger-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Removing..." : "Remove"}
        </button>
      </ModalFooter>
    </Modal>
  );
}

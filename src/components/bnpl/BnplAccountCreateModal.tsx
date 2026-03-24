"use client";

import NewBnplAccountForm from "@/components/bnpl/NewBnplAccountForm";
import { Modal, ModalBody, ModalHeader } from "@/components/ui/Modal";
import type { BnplAccountSummary } from "@/lib/types/bnpl";

interface BnplAccountCreateModalProps {
  open: boolean;
  storeId: string;
  onClose: () => void;
  onCreated?: (account: BnplAccountSummary) => void;
}

export function BnplAccountCreateModal({
  open,
  storeId,
  onClose,
  onCreated,
}: BnplAccountCreateModalProps) {
  return (
    <Modal open={open} onClose={onClose} size="lg">
      <ModalHeader
        title="Create BNPL account"
        description="Add a customer account without leaving the current flow."
        onClose={onClose}
      />
      <ModalBody>
        <NewBnplAccountForm
          storeId={storeId}
          onCancel={onClose}
          onSuccess={(account) => {
            onCreated?.(account);
            onClose();
          }}
        />
      </ModalBody>
    </Modal>
  );
}
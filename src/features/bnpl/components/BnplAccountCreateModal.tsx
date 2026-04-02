"use client";

import { Modal, ModalBody, ModalHeader } from "@/components/ui/Modal";
import NewBnplAccountForm from "../components/NewBnplAccountForm";
import type { BnplAccountSummary } from "../types";

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

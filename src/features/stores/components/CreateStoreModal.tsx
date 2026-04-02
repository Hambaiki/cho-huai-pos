"use client";

import { Modal, ModalHeader } from "@/components/ui/Modal";
import { CreateStoreForm } from "./CreateStoreForm";

interface CreateStoreModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateStoreModal({ open, onClose }: CreateStoreModalProps) {
  return (
    <Modal open={open} onClose={onClose} size="md">
      <ModalHeader
        title="Create new store"
        description="Set up a new workspace with its own currency and settings."
        onClose={onClose}
      />
      <div className="p-5">
        <CreateStoreForm ctaLabel="Create store" />
      </div>
    </Modal>
  );
}

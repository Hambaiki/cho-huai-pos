"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal, ModalBody, ModalHeader } from "@/components/ui/Modal";
import AddInstallmentForm from "@/components/bnpl/AddInstallmentForm";

interface AddInstallmentModalProps {
  accountId: string;
  storeId: string;
}

export default function AddInstallmentModal({
  accountId,
  storeId,
}: AddInstallmentModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        icon={<Plus size={16} />}
        onClick={() => setOpen(true)}
      >
        Add Installment
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} size="md">
        <ModalHeader
          title="Add Installment"
          description="Schedule a new payment due for this account."
          onClose={() => setOpen(false)}
        />
        <ModalBody>
          <AddInstallmentForm
            accountId={accountId}
            storeId={storeId}
            onSuccess={() => setOpen(false)}
          />
        </ModalBody>
      </Modal>
    </>
  );
}

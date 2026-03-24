"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { voidOrderAction } from "@/lib/actions/orders";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/Modal";

export default function VoidOrderButton({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleVoid() {
    if (!reason.trim()) {
      setError("Please provide a reason for voiding this order.");
      return;
    }
    startTransition(async () => {
      const result = await voidOrderAction(orderId, reason);
      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-lg bg-danger-600 text-white text-sm font-medium hover:bg-danger-700 transition-colors"
      >
        Void Order
      </button>

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setError(null);
          setReason("");
        }}
        size="md"
      >
        <ModalHeader
          title="Void Order"
          description="This action cannot be undone. The order status will be changed to voided."
          onClose={() => {
            setOpen(false);
            setError(null);
            setReason("");
          }}
        />
        <ModalBody>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Reason
          </label>
          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setError(null);
            }}
            rows={3}
            className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="e.g. Customer cancelled order"
          />
          {error && <p className="mt-2 text-xs text-danger-600">{error}</p>}
        </ModalBody>
        <ModalFooter>
          <button
            onClick={() => {
              setOpen(false);
              setError(null);
              setReason("");
            }}
            className="px-4 py-2 rounded-lg border border-neutral-300 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Cancel
          </button>
          <button
            onClick={handleVoid}
            disabled={isPending}
            className="px-4 py-2 rounded-lg bg-danger-600 text-white text-sm font-medium hover:bg-danger-700 disabled:opacity-60 transition-colors"
          >
            {isPending ? "Voiding…" : "Confirm Void"}
          </button>
        </ModalFooter>
      </Modal>
    </>
  );
}

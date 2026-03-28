"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { voidOrderAction } from "@/lib/actions/orders";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useSyncPendingAction } from "@/components/ui/PendingActionProvider";
import { XCircle } from "lucide-react";

export default function VoidOrderButton({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useSyncPendingAction(isPending, {
    message: "Voiding the order...",
    subMessage:
      "This may take a moment. Please do not close or refresh the page.",
  });

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
      <Button
        icon={<XCircle size={16} />}
        onClick={() => setOpen(true)}
        variant="destructive"
      >
        Void Order
      </Button>

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
          <Button
            onClick={() => {
              setOpen(false);
              setError(null);
              setReason("");
            }}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            onClick={handleVoid}
            disabled={isPending}
            variant="destructive"
            isLoading={isPending}
          >
            {isPending ? "Voiding…" : "Confirm Void"}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}

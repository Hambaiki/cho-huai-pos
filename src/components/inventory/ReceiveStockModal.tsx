"use client";

import { useActionState } from "react";
import { receiveStockAction } from "@/lib/actions/inventory";
import { useStoreContext } from "@/lib/store-context";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import {
  FormField,
  FormLabel,
  FormInput,
  FormTextarea,
  FormError,
} from "@/components/ui/form";

interface ReceiveStockModalProps {
  open: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  currentCostPrice: number | null;
  onSuccess?: () => void;
}

export function ReceiveStockModal({
  open,
  onClose,
  productId,
  productName,
  currentCostPrice,
  onSuccess,
}: ReceiveStockModalProps) {
  const store = useStoreContext();

  const [state, formAction, isPending] = useActionState(
    async (
      _prev: { data: null; error: string | null },
      formData: FormData,
    ) => {
      formData.set("storeId", store.storeId);
      formData.set("productId", productId);

      const result = await receiveStockAction(formData);

      if (result.error) {
        return { data: null, error: result.error };
      }

      if (onSuccess) onSuccess();
      onClose();
      return { data: null, error: null };
    },
    { data: null, error: null as string | null },
  );

  return (
    <Modal open={open} onClose={onClose} size="sm">
      <ModalHeader
        title="Receive Stock"
        description={productName}
        onClose={onClose}
      />

      <form action={formAction}>
        <ModalBody className="space-y-4">
          <FormError message={state?.error} />

          <div className="grid grid-cols-2 gap-4">
            <FormField>
              <FormLabel htmlFor="quantity" required>
                Quantity Received
              </FormLabel>
              <FormInput
                type="number"
                id="quantity"
                name="quantity"
                min="1"
                step="1"
                placeholder="0"
                required
              />
            </FormField>

            <FormField>
              <FormLabel htmlFor="unitCost" required>
                Unit Cost
              </FormLabel>
              <FormInput
                type="number"
                id="unitCost"
                name="unitCost"
                step="0.01"
                min="0"
                placeholder="0.00"
                defaultValue={currentCostPrice ?? ""}
                required
              />
            </FormField>
          </div>

          <FormField>
            <FormLabel htmlFor="sourceRef">Invoice / PO Reference</FormLabel>
            <FormInput
              id="sourceRef"
              name="sourceRef"
              placeholder="e.g. INV-2026-001"
            />
          </FormField>

          <FormField>
            <FormLabel htmlFor="notes">Notes</FormLabel>
            <FormTextarea
              id="notes"
              name="notes"
              rows={2}
              placeholder="Optional notes about this delivery"
            />
          </FormField>
        </ModalBody>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending} isLoading={isPending}>
            {isPending ? "Saving…" : "Receive Stock"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

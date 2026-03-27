"use client";

import { useActionState, useCallback, useMemo, useState } from "react";
import { adjustStockAction } from "@/lib/actions/inventory";
import { useStoreContext } from "@/lib/store-context";
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import {
  FormError,
  FormField,
  FormInput,
  FormLabel,
  FormSelect,
  FormSelectOption,
  FormTextarea,
} from "@/components/ui/form";
import { useSyncPendingAction } from "@/components/ui/PendingActionProvider";

interface AdjustStockModalProps {
  open: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  currentCostPrice: number | null;
  onSuccess?: () => void;
}

const INCREASE_REASONS = [
  { value: "return", label: "Return" },
  { value: "correction", label: "Correction" },
  { value: "initial", label: "Initial" },
] as const;

const DECREASE_REASONS = [
  { value: "damage", label: "Damage" },
  { value: "loss", label: "Loss" },
  { value: "correction", label: "Correction" },
] as const;

export function AdjustStockModal({
  open,
  onClose,
  productId,
  productName,
  currentCostPrice,
  onSuccess,
}: AdjustStockModalProps) {
  const store = useStoreContext();
  const [direction, setDirection] = useState<"increase" | "decrease">(
    "decrease",
  );

  const reasonOptions = useMemo(
    () => (direction === "increase" ? INCREASE_REASONS : DECREASE_REASONS),
    [direction],
  );

  const handleClose = useCallback(() => {
    setDirection("decrease");
    onClose();
  }, [onClose]);

  const [state, formAction, isPending] = useActionState(
    async (_prev: { data: null; error: string | null }, formData: FormData) => {
      formData.set("storeId", store.storeId);
      formData.set("productId", productId);
      formData.set("direction", direction);

      if (!formData.get("reason")) {
        formData.set("reason", reasonOptions[0].value);
      }

      const result = await adjustStockAction(formData);

      if (result.error) {
        return { data: null, error: result.error };
      }

      onSuccess?.();
      handleClose();
      return { data: null, error: null };
    },
    { data: null, error: null as string | null },
  );

  useSyncPendingAction(isPending, {
    message: "Saving stock adjustment...",
    subMessage:
      "This may take a moment. Please do not close or refresh the page.",
  });

  return (
    <>
      <Modal open={open} onClose={handleClose} size="sm">
        <ModalHeader
          title="Adjust Stock"
          description={productName}
          onClose={handleClose}
        />

        <form action={formAction}>
          <ModalBody className="space-y-4">
            <FormError message={state?.error} />

            <div className="grid grid-cols-2 gap-4">
              <FormField>
                <FormLabel htmlFor="direction" required>
                  Direction
                </FormLabel>
                <FormSelect
                  id="direction"
                  name="direction_ui"
                  value={direction}
                  onChange={(value: string) =>
                    setDirection(value as "increase" | "decrease")
                  }
                >
                  <FormSelectOption value="decrease">Decrease</FormSelectOption>
                  <FormSelectOption value="increase">Increase</FormSelectOption>
                </FormSelect>
              </FormField>

              <FormField>
                <FormLabel htmlFor="reason" required>
                  Reason
                </FormLabel>
                <FormSelect
                  key={direction}
                  id="reason"
                  name="reason"
                  defaultValue={reasonOptions[0].value}
                >
                  {reasonOptions.map((reason) => (
                    <FormSelectOption key={reason.value} value={reason.value}>
                      {reason.label}
                    </FormSelectOption>
                  ))}
                </FormSelect>
              </FormField>
            </div>

            <FormField>
              <FormLabel htmlFor="quantity" required>
                Quantity
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

            {direction === "increase" ? (
              <FormField>
                <FormLabel htmlFor="unitCost" required>
                  Unit Cost
                </FormLabel>
                <FormInput
                  type="number"
                  id="unitCost"
                  name="unitCost"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  defaultValue={currentCostPrice ?? ""}
                  required
                />
                <p className="mt-1 text-xs text-neutral-500">
                  Required because stock increases create a new lot.
                </p>
              </FormField>
            ) : null}

            <FormField>
              <FormLabel htmlFor="notes">Notes</FormLabel>
              <FormTextarea
                id="notes"
                name="notes"
                rows={3}
                placeholder="Optional explanation for this adjustment"
              />
            </FormField>
          </ModalBody>

          <ModalFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} isLoading={isPending}>
              {isPending ? "Saving..." : "Save Adjustment"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </>
  );
}

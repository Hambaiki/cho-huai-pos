import { Button } from "@/components/ui/Button";
import {
  FormDateTimeSelect,
  FormError,
  FormField,
  FormInput,
  FormLabel,
  FormSelect,
  FormSelectOption,
} from "@/components/ui/form";
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/Modal";
import { useState, useTransition } from "react";
import { createPromotionAction } from "../actions";

interface CreatePromotionModalProps {
  storeId: string;
  open: boolean;
  onClose: () => void;
}

export default function CreatePromotionModal({
  storeId,
  open,
  onClose,
}: CreatePromotionModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <Modal open={open} onClose={onClose} scrollable>
      <ModalHeader
        title="Create promotion"
        description="Automatic promotions do not need a code and are applied by best value."
      />
      <form
        className="flex min-h-0 flex-col"
        action={(formData) => {
          startTransition(async () => {
            setError(null);

            const appliesAutomatically =
              formData.get("appliesAutomatically") === "on";
            const result = await createPromotionAction({
              storeId,
              name: String(formData.get("name") ?? ""),
              code: String(formData.get("code") ?? ""),
              type: String(formData.get("type") ?? "fixed_amount") as
                | "fixed_amount"
                | "percentage",
              value: Number(formData.get("value") ?? 0),
              minOrderTotal: Number(formData.get("minOrderTotal") ?? 0),
              maxDiscountAmount: formData.get("maxDiscountAmount")
                ? Number(formData.get("maxDiscountAmount"))
                : undefined,
              maxRedemptions: formData.get("maxRedemptions")
                ? Number(formData.get("maxRedemptions"))
                : undefined,
              appliesAutomatically,
              startsAt: String(formData.get("startsAt") ?? ""),
              endsAt: String(formData.get("endsAt") ?? ""),
            });

            if (result.error) {
              setError(result.error);
            }
          });
        }}
      >
        <ModalBody>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <FormField>
              <FormLabel htmlFor="name" required>
                Promotion name
              </FormLabel>
              <FormInput
                id="name"
                name="name"
                required
                placeholder="Happy hour 10%"
              />
            </FormField>

            <FormField>
              <FormLabel htmlFor="code">Promo code (manual only)</FormLabel>
              <FormInput
                id="code"
                name="code"
                placeholder="SAVE10"
                className="uppercase"
              />
            </FormField>

            <FormField>
              <FormLabel htmlFor="type" required>
                Type
              </FormLabel>
              <FormSelect id="type" name="type" defaultValue="fixed_amount">
                <FormSelectOption value="fixed_amount">
                  Fixed amount
                </FormSelectOption>
                <FormSelectOption value="percentage">
                  Percentage
                </FormSelectOption>
              </FormSelect>
            </FormField>

            <FormField>
              <FormLabel htmlFor="value" required>
                Value
              </FormLabel>
              <FormInput
                id="value"
                name="value"
                type="number"
                min={0}
                step="0.01"
                required
              />
            </FormField>

            <FormField>
              <FormLabel htmlFor="minOrderTotal">Minimum order total</FormLabel>
              <FormInput
                id="minOrderTotal"
                name="minOrderTotal"
                type="number"
                min={0}
                step="0.01"
                defaultValue={0}
              />
            </FormField>

            <FormField>
              <FormLabel htmlFor="maxDiscountAmount">
                Max discount cap
              </FormLabel>
              <FormInput
                id="maxDiscountAmount"
                name="maxDiscountAmount"
                type="number"
                min={0}
                step="0.01"
              />
            </FormField>

            <FormField>
              <FormLabel htmlFor="maxRedemptions">
                Max uses (optional)
              </FormLabel>
              <FormInput
                id="maxRedemptions"
                name="maxRedemptions"
                type="number"
                min={1}
                step="1"
                placeholder="Unlimited if empty"
              />
            </FormField>

            <FormField>
              <FormLabel htmlFor="startsAt">Start date/time</FormLabel>
              <FormDateTimeSelect
                id="startsAt"
                name="startsAt"
                placeholder="Select start date and time"
              />
            </FormField>

            <FormField>
              <FormLabel htmlFor="endsAt">End date/time</FormLabel>
              <FormDateTimeSelect
                id="endsAt"
                name="endsAt"
                placeholder="Select end date and time"
              />
            </FormField>
          </div>

          <label className="mt-3 inline-flex items-center gap-2 text-sm text-neutral-700">
            <input type="checkbox" name="appliesAutomatically" />
            Apply automatically at checkout
          </label>

          <FormError message={error} />
        </ModalBody>

        <ModalFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending} isLoading={isPending}>
            Save promotion
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

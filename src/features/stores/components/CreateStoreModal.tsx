"use client";

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
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/Modal";
import { useSyncPendingAction } from "@/features/shell/pending/PendingActionProvider";
import {
  createStoreAction,
  CreateStoreActionState,
} from "@/features/stores/actions";
import { DEFAULT_CURRENCY } from "@/lib/utils/currency";
import { useActionState } from "react";

const initialState: CreateStoreActionState = { error: null };

interface CreateStoreModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateStoreModal({ open, onClose }: CreateStoreModalProps) {
  const [state, action, isPending] = useActionState(
    createStoreAction,
    initialState,
  );

  useSyncPendingAction(isPending, {
    message: "Creating a new store...",
    subMessage:
      "This may take a moment. Please do not close or refresh the page.",
  });

  return (
    <Modal open={open} onClose={onClose} size="md">
      <ModalHeader
        title="Create new store"
        description="Set up a new workspace with its own currency and settings."
        onClose={onClose}
      />

      <form action={action}>
        <ModalBody className="space-y-4">
          <FormField>
            <FormLabel htmlFor="name" required>
              Store name
            </FormLabel>
            <FormInput id="name" name="name" required type="text" />
          </FormField>

          <FormField>
            <FormLabel htmlFor="address">Address</FormLabel>
            <FormTextarea id="address" name="address" rows={5} />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField>
              <FormLabel htmlFor="currency_code" required>
                Currency code
              </FormLabel>
              <FormInput
                defaultValue={DEFAULT_CURRENCY.currency_code}
                id="currency_code"
                maxLength={3}
                name="currency_code"
                required
                type="text"
                className="uppercase"
              />
            </FormField>

            <FormField>
              <FormLabel htmlFor="currency_symbol" required>
                Currency symbol
              </FormLabel>
              <FormInput
                defaultValue={DEFAULT_CURRENCY.currency_symbol}
                id="currency_symbol"
                maxLength={6}
                name="currency_symbol"
                required
                type="text"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField>
              <FormLabel htmlFor="currency_decimals" required>
                Decimal places
              </FormLabel>
              <FormInput
                defaultValue={DEFAULT_CURRENCY.currency_decimals}
                id="currency_decimals"
                max={4}
                min={0}
                name="currency_decimals"
                required
                type="number"
              />
            </FormField>

            <FormField>
              <FormLabel htmlFor="symbol_position" required>
                Symbol position
              </FormLabel>
              <FormSelect
                defaultValue={DEFAULT_CURRENCY.symbol_position}
                id="symbol_position"
                name="symbol_position"
              >
                <FormSelectOption value="prefix">Prefix</FormSelectOption>
                <FormSelectOption value="suffix">Suffix</FormSelectOption>
              </FormSelect>
            </FormField>
          </div>

          <FormError message={state.error} />
        </ModalBody>

        <ModalFooter>
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button disabled={isPending} type="submit">
            {isPending ? "Creating store..." : "Create store"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

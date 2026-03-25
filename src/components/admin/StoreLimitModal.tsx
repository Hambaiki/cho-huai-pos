"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { setUserStoreLimitOverrideAction } from "@/lib/actions/admin";
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface StoreLimitModalProps {
  open: boolean;
  onClose: () => void;
  profile: {
    id: string;
    display_name: string | null;
    store_limit_override: number | null;
  };
}

export function StoreLimitModal({
  open,
  onClose,
  profile,
}: StoreLimitModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [storeLimitDraftByUser, setStoreLimitDraftByUser] = useState<
    Record<string, string>
  >({});
  const [error, setError] = useState<string | null>(null);

  const defaultStoreLimitInput = profile.store_limit_override
    ? String(profile.store_limit_override)
    : "";
  const storeLimitInput =
    storeLimitDraftByUser[profile.id] ?? defaultStoreLimitInput;

  const handleClose = () => {
    setStoreLimitDraftByUser((current) => {
      if (!(profile.id in current)) {
        return current;
      }

      const next = { ...current };
      delete next[profile.id];
      return next;
    });
    setError(null);
    onClose();
  };

  const handleConfirm = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("userId", profile.id);
      formData.set("storeLimitOverride", storeLimitInput.trim());

      const result = await setUserStoreLimitOverrideAction(formData);

      if (!result.ok) {
        setError(result.error ?? "Unable to complete this action.");
        return;
      }

      handleClose();
      router.refresh();
    });
  };

  return (
    <Modal open={open} onClose={handleClose} size="md">
      <ModalHeader title="Update Store Limit" onClose={handleClose} />
      <ModalBody>
        <div className="space-y-3">
          <p className="text-sm text-neutral-600">
            Set a store limit override for this user. Leave the field empty to
            use the global default from site settings.
          </p>
          <input
            type="number"
            min={1}
            step={1}
            value={storeLimitInput}
            onChange={(event) => {
              setStoreLimitDraftByUser((current) => ({
                ...current,
                [profile.id]: event.target.value,
              }));
              setError(null);
            }}
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-brand-500"
            placeholder="Use default"
          />
        </div>
        {error && <p className="mt-3 text-sm text-danger-700">{error}</p>}
      </ModalBody>
      <ModalFooter>
        <Button type="button" variant="outline" onClick={handleClose}>
          Cancel
        </Button>
        <Button type="button" isLoading={isPending} onClick={handleConfirm}>
          {isPending ? "Saving..." : "Confirm"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

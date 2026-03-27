import { Modal, ModalBody } from "@/components/ui/Modal";
import { Loader } from "@/components/ui/Loader";

interface PendingActionModalProps {
  open: boolean;
  message?: string;
  subMessage?: string;
}

/**
 * Blocks the UI with a centred loading overlay while a server action is in
 * flight.  Pass `open={isPending}` from `useActionState` (or any boolean) and
 * an optional `message` / `subMessage` to describe the operation.
 */
export function PendingActionModal({
  open,
  message = "Please wait, this may take a moment.",
  subMessage = "Please do not close this window.",
}: PendingActionModalProps) {
  return (
    <Modal open={open} size="sm" onClose={() => {}}>
      <ModalBody className="flex flex-col items-center gap-4 p-10">
        <Loader />
        <p className="mt-6 text-center">
          <span className="font-bold text-lg text-black animate-pulse">
            {message}
          </span>
          {/* add 3 dot animation */}
          {subMessage && (
            <>
              <br />
              <span className="text-sm text-neutral-700">{subMessage}</span>
            </>
          )}
        </p>
      </ModalBody>
    </Modal>
  );
}

"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import { recordGeneralBnplPaymentAction } from "@/lib/actions/bnpl";
import { Numpad } from "@/components/pos/Numpad";
import { QrPaymentScreen, type QrChannel } from "@/components/pos/QrPaymentScreen";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { formatCurrency, type CurrencyStore } from "@/lib/utils/currency";
import { FormField, FormLabel, FormInput, FormError } from "@/components/ui/form";

type PaymentMethod = "cash" | "qr_transfer";

export default function RecordGeneralPaymentForm({
  accountId,
  storeId,
  maxAmount,
  currency,
  qrChannels,
  onDone,
}: {
  accountId: string;
  storeId: string;
  maxAmount: number;
  currency: CurrencyStore;
  qrChannels: QrChannel[];
  onDone: () => void;
}) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [numpadValue, setNumpadValue] = useState<string>(String(maxAmount.toFixed(2)));
  const [note, setNote] = useState("");
  const [selectedChannel, setSelectedChannel] = useState<QrChannel | null>(null);
  const [showQrScreen, setShowQrScreen] = useState(false);
  const [, startTransition] = useTransition();

  const [state, formAction, isPending] = useActionState(recordGeneralBnplPaymentAction, {
    data: null,
    error: null,
  });

  if (state.data !== null) {
    onDone();
  }

  const amountPaid = parseFloat(numpadValue) || 0;
  const enabledChannels = qrChannels.filter((channel) => channel.is_enabled !== false);
  const isCashInvalid = amountPaid <= 0 || amountPaid > maxAmount;
  const isQrInvalid = amountPaid <= 0 || amountPaid > maxAmount || !selectedChannel;

  const quickAmounts = useMemo(() => {
    const exact = Number(maxAmount.toFixed(2));
    const ceil = Math.ceil(maxAmount);
    const candidates = [
      exact,
      ceil,
      Math.ceil(maxAmount / 10) * 10,
      Math.ceil(maxAmount / 50) * 50,
      Math.ceil(maxAmount / 100) * 100,
    ];
    const seen = new Set<number>();

    return candidates.filter((value) => {
      if (value <= 0 || value > maxAmount || seen.has(value)) return false;
      seen.add(value);
      return true;
    });
  }, [maxAmount]);

  if (showQrScreen && selectedChannel) {
    return (
      <QrPaymentScreen
        channel={selectedChannel}
        amount={amountPaid}
        currency={currency}
        onConfirm={(reference) => {
          const fd = new FormData();
          fd.set("accountId", accountId);
          fd.set("storeId", storeId);
          fd.set("amountPaid", String(amountPaid));
          fd.set("paymentMethod", "qr_transfer");
          if (note.trim()) fd.set("note", note.trim());
          if (selectedChannel.id) fd.set("qrChannelId", selectedChannel.id);
          if (reference?.trim()) fd.set("qrReference", reference.trim());

          setShowQrScreen(false);
          startTransition(() => {
            formAction(fd);
          });
        }}
        onCancel={() => setShowQrScreen(false)}
      />
    );
  }

  return (
    <Modal open onClose={onDone} size="lg" className="flex max-h-[95dvh] flex-col">
      <div className="border-b border-border px-5 py-4">
        <h3 className="text-lg font-semibold text-neutral-900">Record account payment</h3>
        <p className="mt-0.5 text-sm text-neutral-600">
          Balance due: <strong>{formatCurrency(maxAmount, currency)}</strong>
        </p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        <div className="grid grid-cols-2 gap-2">
          {(["cash", "qr_transfer"] as const).map((method) => (
            <Button
              key={method}
              variant={paymentMethod === method ? "active" : "outline"}
              size="sm"
              onClick={() => {
                setPaymentMethod(method);
                if (method === "cash") {
                  setSelectedChannel(null);
                }
              }}
              type="button"
            >
              {method === "cash" ? "Cash" : "QR Transfer"}
            </Button>
          ))}
        </div>

        {paymentMethod === "cash" && (
          <div className="space-y-3">
            <div>
              <p className="mb-1.5 text-xs font-medium text-neutral-500">Quick amounts</p>
              <div className="flex flex-wrap gap-2">
                {quickAmounts.map((quickAmount) => (
                  <Button
                    key={quickAmount}
                    type="button"
                    variant={amountPaid === quickAmount ? "active" : "outline"}
                    size="sm"
                    onClick={() => setNumpadValue(String(quickAmount))}
                  >
                    {formatCurrency(quickAmount, currency)}
                  </Button>
                ))}
              </div>
            </div>

            <Numpad value={numpadValue} onChange={setNumpadValue} currency={currency} />
          </div>
        )}

        {paymentMethod === "qr_transfer" && enabledChannels.length > 0 && (
          <div className="space-y-2">
            <FormField>
              <FormLabel htmlFor="qrAmount">Amount paid</FormLabel>
              <FormInput
                id="qrAmount"
                type="number"
                min="0.01"
                step="0.01"
                max={maxAmount}
                value={numpadValue}
                onChange={(event) => setNumpadValue(event.target.value)}
              />
            </FormField>

            <p className="pt-2 text-xs font-medium text-neutral-600">Select channel</p>
            <div className="grid gap-2">
              {enabledChannels.map((channel) => (
                <button
                  key={channel.id}
                  type="button"
                  onClick={() => setSelectedChannel(channel)}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition ${
                    selectedChannel?.id === channel.id
                      ? "border-brand-700 bg-brand-50 text-brand-700"
                      : "border-border text-neutral-700 hover:bg-neutral-50"
                  }`}
                >
                  <span className="font-medium">{channel.label}</span>
                </button>
              ))}
            </div>

            {selectedChannel && (
              <button
                type="button"
                onClick={() => setShowQrScreen(true)}
                disabled={isQrInvalid || isPending}
                className="mt-2 w-full rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
              >
                Show QR code →
              </button>
            )}
          </div>
        )}

        {paymentMethod === "qr_transfer" && enabledChannels.length === 0 && (
          <p className="rounded-lg border border-warning-200 bg-warning-50 px-3 py-2 text-xs text-warning-700">
            No QR channels configured. Add one in Settings → QR Channels.
          </p>
        )}

        <FormField>
          <FormLabel htmlFor="note">Note</FormLabel>
          <FormInput
            id="note"
            name="note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Optional"
          />
        </FormField>

        <FormError message={state.error} />
      </div>

      <form action={formAction} className="border-t border-border px-5 py-4">
        <input type="hidden" name="accountId" value={accountId} />
        <input type="hidden" name="storeId" value={storeId} />
        <input type="hidden" name="amountPaid" value={amountPaid} />
        <input type="hidden" name="paymentMethod" value={paymentMethod} />
        <input type="hidden" name="note" value={note} />

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onDone}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Cancel
          </button>
          {paymentMethod === "cash" && (
            <button
              type="submit"
              disabled={isPending || isCashInvalid}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
            >
              {isPending ? "Recording..." : "Record payment"}
            </button>
          )}
          {paymentMethod === "qr_transfer" && (
            <button
              type="button"
              disabled
              className="rounded-lg bg-neutral-200 px-4 py-2 text-sm font-medium text-neutral-500"
            >
              Confirm on QR screen
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}

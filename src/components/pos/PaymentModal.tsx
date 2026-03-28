"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { BnplAccountCreateModal } from "@/components/bnpl/BnplAccountCreateModal";
import { Numpad } from "@/components/pos/Numpad";
import {
  QrPaymentScreen,
  type QrChannel,
} from "@/components/pos/QrPaymentScreen";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { BnplAccountSummary } from "@/lib/types/bnpl";
import { formatCurrency, type CurrencyStore } from "@/lib/utils/currency";
import { FormField, FormLabel, FormInput } from "@/components/ui/form";

type PaymentMethod = "cash" | "qr_transfer" | "bnpl";

function dedupeBnplAccounts(accounts: BnplAccountSummary[]) {
  const seen = new Set<string>();
  return accounts.filter((account) => {
    if (seen.has(account.id)) return false;
    seen.add(account.id);
    return true;
  });
}

function getDefaultBnplDueDate() {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().slice(0, 10);
}

export interface PaymentConfirmPayload {
  paymentMethod: PaymentMethod;
  amountTendered?: number;
  qrChannelId?: string;
  qrReference?: string;
  bnplAccountId?: string;
  bnplDueDate?: string;
}

interface PaymentModalProps {
  open: boolean;
  amount: number;
  currency: CurrencyStore;
  qrChannels?: QrChannel[];
  bnplAccounts?: BnplAccountSummary[];
  canCreateBnplAccount?: boolean;
  storeId: string;
  onClose: () => void;
  onConfirm: (payload: PaymentConfirmPayload) => void;
}

export function PaymentModal({
  open,
  amount,
  currency,
  qrChannels = [],
  bnplAccounts: initialBnplAccounts = [],
  canCreateBnplAccount = false,
  storeId,
  onClose,
  onConfirm,
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [numpadValue, setNumpadValue] = useState<string>(
    String(Math.ceil(amount)),
  );
  const [selectedChannel, setSelectedChannel] = useState<QrChannel | null>(
    null,
  );
  const [showQrScreen, setShowQrScreen] = useState(false);
  const [bnplAccounts, setBnplAccounts] = useState(
    dedupeBnplAccounts(initialBnplAccounts),
  );
  const [bnplSearch, setBnplSearch] = useState("");
  const [selectedBnplAccountId, setSelectedBnplAccountId] = useState<
    string | null
  >(null);
  const [bnplDueDate, setBnplDueDate] = useState(getDefaultBnplDueDate());
  const [showCreateBnplModal, setShowCreateBnplModal] = useState(false);

  const amountTendered = parseFloat(numpadValue) || 0;
  const enabledChannels = qrChannels.filter(
    (channel) => channel.is_enabled !== false,
  );

  useEffect(() => {
    setBnplAccounts(dedupeBnplAccounts(initialBnplAccounts));
  }, [initialBnplAccounts]);

  const change = useMemo(() => {
    if (paymentMethod !== "cash") return 0;
    return Math.max(0, amountTendered - amount);
  }, [amount, amountTendered, paymentMethod]);

  const quickAmounts = useMemo(() => {
    const ceil = Math.ceil(amount);
    const candidates = [
      ceil,
      Math.ceil(amount / 10) * 10,
      Math.ceil(amount / 50) * 50,
      Math.ceil(amount / 100) * 100,
      Math.ceil(amount / 500) * 500,
      Math.ceil(amount / 1000) * 1000,
    ];
    const seen = new Set<number>();

    return candidates
      .filter((value) => {
        if (value < amount || seen.has(value)) return false;
        seen.add(value);
        return true;
      })
      .slice(0, 5);
  }, [amount]);

  const filteredBnplAccounts = useMemo(() => {
    const query = bnplSearch.trim().toLowerCase();
    if (!query) return bnplAccounts;

    return bnplAccounts.filter((account) => {
      return (
        account.customer_name.toLowerCase().includes(query) ||
        account.customer_phone?.toLowerCase().includes(query)
      );
    });
  }, [bnplAccounts, bnplSearch]);

  const selectedBnplAccount = bnplAccounts.find(
    (account) => account.id === selectedBnplAccountId,
  );
  const selectedBnplAvailable = selectedBnplAccount
    ? Number(selectedBnplAccount.credit_limit) -
      Number(selectedBnplAccount.balance_due)
    : 0;
  const isBnplSelectionInvalid =
    paymentMethod === "bnpl" &&
    (!selectedBnplAccount ||
      selectedBnplAccount.status !== "active" ||
      selectedBnplAvailable < amount ||
      !bnplDueDate);

  if (showQrScreen && selectedChannel) {
    return (
      <QrPaymentScreen
        channel={selectedChannel}
        amount={amount}
        currency={currency}
        onConfirm={(reference) => {
          setShowQrScreen(false);
          onConfirm({
            paymentMethod: "qr_transfer",
            qrChannelId: selectedChannel.id,
            qrReference: reference,
          });
        }}
        onCancel={() => {
          setShowQrScreen(false);
          setSelectedChannel(null);
        }}
      />
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      className="flex max-h-[95dvh] flex-col"
    >
      <div className="border-b border-border px-5 py-4">
        <h3 className="text-lg font-semibold text-neutral-900">
          Confirm payment
        </h3>
        <p className="mt-1 text-sm text-neutral-600">
          Total:{" "}
          <strong className="text-neutral-900">
            {formatCurrency(amount, currency)}
          </strong>
        </p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(["cash", "qr_transfer", "bnpl"] as const).map((method) => (
            <Button
              key={method}
              variant={paymentMethod === method ? "active" : "outline"}
              size="sm"
              onClick={() => {
                setPaymentMethod(method);
                setSelectedChannel(null);
              }}
              type="button"
            >
              {method === "qr_transfer"
                ? "QR Transfer"
                : method === "cash"
                  ? "Cash"
                  : "BNPL"}
            </Button>
          ))}
        </div>

        {paymentMethod === "cash" && (
          <div className="space-y-3">
            <div>
              <p className="mb-2 text-xs font-medium text-neutral-500">
                Quick amounts
              </p>
              <div className="flex flex-wrap gap-2">
                {quickAmounts.map((quickAmount) => (
                  <Button
                    key={quickAmount}
                    type="button"
                    onClick={() => setNumpadValue(String(quickAmount))}
                    variant={
                      amountTendered === quickAmount ? "active" : "outline"
                    }
                    size="sm"
                  >
                    {formatCurrency(quickAmount, currency)}
                  </Button>
                ))}
              </div>
            </div>

            <Numpad
              value={numpadValue}
              onChange={setNumpadValue}
              currency={currency}
            />

            <div className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3">
              <span className="text-sm text-neutral-600">Change</span>
              <span
                className={`text-base font-bold tabular-nums ${
                  change > 0 ? "text-success-700" : "text-neutral-900"
                }`}
              >
                {formatCurrency(change, currency)}
              </span>
            </div>
          </div>
        )}

        {paymentMethod === "qr_transfer" && enabledChannels.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-neutral-600">
              Select channel
            </p>
            <div className="grid gap-2">
              {enabledChannels.map((channel) => (
                <Button
                  key={channel.id}
                  type="button"
                  onClick={() => setSelectedChannel(channel)}
                  variant={
                    selectedChannel?.id === channel.id ? "active" : "outline"
                  }
                  className="justify-start"
                >
                  <span className="font-medium">{channel.label}</span>
                </Button>
              ))}
            </div>
            {selectedChannel && (
              <Button
                type="button"
                onClick={() => setShowQrScreen(true)}
                className="mt-2 w-full"
              >
                Show QR code →
              </Button>
            )}
          </div>
        )}

        {paymentMethod === "qr_transfer" && enabledChannels.length === 0 && (
          <p className="rounded-lg border border-warning-200 bg-warning-50 px-3 py-2 text-xs text-warning-700">
            No QR channels configured. Add one in Settings → QR Channels.
          </p>
        )}

        {paymentMethod === "bnpl" && (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-900">
                  Select BNPL account
                </p>
                <p className="text-xs text-neutral-500">
                  Search existing customer accounts or create one during
                  checkout.
                </p>
              </div>
              {canCreateBnplAccount && (
                <Button
                  type="button"
                  icon={<Plus size={16} />}
                  onClick={() => setShowCreateBnplModal(true)}
                  variant="outline"
                >
                  <span className="whitespace-nowrap">Create account</span>
                </Button>
              )}
            </div>

            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <FormInput
                type="search"
                value={bnplSearch}
                onChange={(event) => setBnplSearch(event.target.value)}
                placeholder="Search by customer name or phone"
                className="pl-9"
              />
            </label>

            <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {filteredBnplAccounts.length === 0 ? (
                <div className="rounded-xl border border-dashed border-neutral-200 px-4 py-6 text-center text-sm text-neutral-500">
                  No BNPL accounts match this search.
                </div>
              ) : (
                filteredBnplAccounts.map((account) => {
                  const available =
                    Number(account.credit_limit) - Number(account.balance_due);
                  const isDisabled =
                    account.status !== "active" || available < amount;

                  return (
                    <button
                      key={account.id}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => setSelectedBnplAccountId(account.id)}
                      className={`w-full rounded-xl border p-3 text-left transition ${
                        selectedBnplAccountId === account.id
                          ? "border-brand-700 bg-brand-50"
                          : "border-border bg-white hover:bg-neutral-50"
                      } ${isDisabled ? "cursor-not-allowed opacity-60" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-neutral-900">
                            {account.customer_name}
                          </p>
                          <p className="mt-1 text-xs text-neutral-500">
                            {account.customer_phone ?? "No phone"}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2 py-1 text-[11px] font-medium capitalize ${
                            account.status === "active"
                              ? "bg-success-100 text-success-700"
                              : account.status === "frozen"
                                ? "bg-warning-100 text-warning-700"
                                : account.status === "settled"
                                  ? "bg-info-100 text-info-700"
                                  : "bg-neutral-100 text-neutral-600"
                          }`}
                        >
                          {account.status}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-lg bg-neutral-50 px-3 py-2">
                          <p className="text-neutral-500">Available credit</p>
                          <p
                            className={`mt-1 font-semibold ${
                              available >= amount
                                ? "text-success-700"
                                : "text-danger-700"
                            }`}
                          >
                            {formatCurrency(available, currency)}
                          </p>
                        </div>
                        <div className="rounded-lg bg-neutral-50 px-3 py-2">
                          <p className="text-neutral-500">Balance due</p>
                          <p className="mt-1 font-semibold text-neutral-900">
                            {formatCurrency(
                              Number(account.balance_due),
                              currency,
                            )}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="rounded-xl border border-border bg-neutral-50 px-4 py-3">
              <FormField>
                <FormLabel htmlFor="bnplDueDate">Due date</FormLabel>
                <FormInput
                  id="bnplDueDate"
                  type="date"
                  value={bnplDueDate}
                  onChange={(event) => setBnplDueDate(event.target.value)}
                />
              </FormField>
              <p className="mt-2 text-xs text-neutral-500">
                Checkout will create one BNPL installment for the full order
                amount.
              </p>
            </div>

            {selectedBnplAccount && (
              <div className="rounded-xl border border-border bg-white px-4 py-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-neutral-600">Selected account</span>
                  <span className="font-semibold text-neutral-900">
                    {selectedBnplAccount.customer_name}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="text-neutral-600">Available after sale</span>
                  <span
                    className={`font-semibold ${
                      selectedBnplAvailable - amount >= 0
                        ? "text-success-700"
                        : "text-danger-700"
                    }`}
                  >
                    {formatCurrency(selectedBnplAvailable - amount, currency)}
                  </span>
                </div>
              </div>
            )}

            {selectedBnplAccount && selectedBnplAvailable < amount && (
              <p className="rounded-lg border border-danger-200 bg-danger-50 px-3 py-2 text-xs text-danger-700">
                This account does not have enough available credit for the
                current cart total.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
        <Button variant="outline" onClick={onClose} type="button">
          Cancel
        </Button>
        {paymentMethod !== "qr_transfer" && (
          <Button
            disabled={
              (paymentMethod === "cash" && amountTendered < amount) ||
              isBnplSelectionInvalid
            }
            onClick={() =>
              onConfirm({
                paymentMethod,
                amountTendered:
                  paymentMethod === "cash" ? amountTendered : undefined,
                bnplAccountId:
                  paymentMethod === "bnpl"
                    ? (selectedBnplAccountId ?? undefined)
                    : undefined,
                bnplDueDate: paymentMethod === "bnpl" ? bnplDueDate : undefined,
              })
            }
            type="button"
          >
            Confirm payment
          </Button>
        )}
      </div>

      {canCreateBnplAccount && (
        <BnplAccountCreateModal
          open={showCreateBnplModal}
          storeId={storeId}
          onClose={() => setShowCreateBnplModal(false)}
          onCreated={(account) => {
            setBnplAccounts((prev) => dedupeBnplAccounts([account, ...prev]));
            setSelectedBnplAccountId(account.id);
            setBnplSearch(account.customer_name);
          }}
        />
      )}
    </Modal>
  );
}

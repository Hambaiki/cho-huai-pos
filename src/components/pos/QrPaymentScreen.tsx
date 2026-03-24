"use client";

import { useState } from "react";
import Image from "next/image";
import { formatCurrency, type CurrencyStore } from "@/lib/utils/currency";

export interface QrChannel {
  id: string;
  label: string;
  image_url: string;
  is_enabled?: boolean;
}

interface QrPaymentScreenProps {
  channel: QrChannel;
  amount: number;
  currency: CurrencyStore;
  onConfirm: (referenceNumber?: string) => void;
  onCancel: () => void;
}

export function QrPaymentScreen({
  channel,
  amount,
  currency,
  onConfirm,
  onCancel,
}: QrPaymentScreenProps) {
  const [reference, setReference] = useState("");

  return (
    <div className="fixed inset-0 z-60 flex flex-col items-center justify-center bg-white px-6 py-8">
      <p className="mb-4 text-sm font-medium text-neutral-500">
        Pay via {channel.label}
      </p>

      <div className="relative mb-4 h-64 w-64 rounded-xl border border-neutral-200 overflow-hidden">
        <Image
          src={channel.image_url}
          alt={`${channel.label} QR code`}
          fill
          unoptimized
          className="object-contain"
        />
      </div>

      <p className="text-5xl font-semibold text-neutral-900 tracking-tight">
        {formatCurrency(amount, currency)}
      </p>
      <p className="mt-2 text-sm text-neutral-500">
        Enter this amount in your app, then scan
      </p>

      <div className="mt-6 w-full max-w-xs space-y-2">
        <label
          htmlFor="qr-reference"
          className="block text-xs font-medium text-neutral-600"
        >
          Reference no. (optional)
        </label>
        <input
          id="qr-reference"
          type="text"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="e.g. 0012345678"
          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none ring-brand-200 transition focus:ring-2"
        />
      </div>

      <div className="mt-6 w-full max-w-xs space-y-3">
        <button
          onClick={() => onConfirm(reference.trim() || undefined)}
          className="w-full rounded-xl bg-brand-700 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-800"
          type="button"
        >
          Confirm payment received
        </button>
        <button
          onClick={onCancel}
          className="w-full text-sm text-neutral-500 hover:text-neutral-700"
          type="button"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/Button";
import { Modal, ModalFooter, ModalHeader } from "@/components/ui/Modal";
import { formatCurrency, type CurrencyStore } from "@/lib/utils/currency";
import { useRef } from "react";
import { ReceiptItem } from "../types";

interface ReceiptModalProps {
  open: boolean;
  orderId: string;
  storeName: string;
  currency: CurrencyStore;
  items: ReceiptItem[];
  subtotal: number;
  discount: number;
  taxAmount: number;
  total: number;
  amountTendered: number | null;
  changeAmount: number;
  paymentMethod: string;
  createdAt: string;
  onClose: () => void;
}

export function ReceiptModal({
  open,
  orderId,
  storeName,
  currency,
  items,
  subtotal,
  discount,
  taxAmount,
  total,
  amountTendered,
  changeAmount,
  paymentMethod,
  createdAt,
  onClose,
}: ReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const el = receiptRef.current;
    if (!el) return;

    const styles = Array.from(document.styleSheets)
      .map((sheet) => {
        try {
          return Array.from(sheet.cssRules)
            .map((rule) => rule.cssText)
            .join("\n");
        } catch {
          return "";
        }
      })
      .join("\n");

    const printWindow = window.open("", "_blank", "width=420,height=700");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt</title>
        <style>${styles}</style>
        <style>
          body { background: white; margin: 0; padding: 16px; }
          @page { size: 80mm auto; margin: 8mm; }
        </style>
      </head>
      <body>${el.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.onafterprint = () => printWindow.close();
    printWindow.print();
  };

  const formattedDate = new Date(createdAt).toLocaleString();
  const paymentLabel = paymentMethod.replace(/_/g, " ").toUpperCase();

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      className="flex flex-col max-h-[90dvh]"
    >
      <ModalHeader title="Receipt" onClose={onClose} />

      {/* Scrollable receipt content captured for printing */}
      <div ref={receiptRef} className="overflow-y-auto">
        <div className="space-y-4 p-6">
          {/* Header */}
          <div className="space-y-2 border-b border-neutral-200 pb-4 text-center">
            <h2 className="text-lg font-bold text-neutral-900">{storeName}</h2>
            <p className="text-sm font-mono text-neutral-600">
              Order #{orderId.slice(0, 8).toUpperCase()}
            </p>
            <p className="text-xs text-neutral-500">{formattedDate}</p>
          </div>

          {/* Items */}
          <div className="space-y-2 border-b border-neutral-200 pb-4">
            {items.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <span className="flex-1 text-sm font-medium text-neutral-900">
                    {item.productName}
                  </span>
                  <span className="text-right text-sm text-neutral-600">
                    {item.quantity} × {formatCurrency(item.unitPrice, currency)}
                  </span>
                </div>
                {item.discount > 0 && (
                  <div className="flex justify-end text-xs text-danger-600">
                    -Discount:{" "}
                    {formatCurrency(item.discount * item.quantity, currency)}
                  </div>
                )}
                <div className="flex justify-end border-t border-dashed border-neutral-200 pt-1 text-sm font-semibold text-neutral-900">
                  {formatCurrency(item.subtotal, currency)}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-2 border-b border-neutral-200 pb-4 text-sm">
            <div className="flex justify-between text-neutral-700">
              <span>Subtotal:</span>
              <span>{formatCurrency(subtotal, currency)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-danger-600">
                <span>Discount:</span>
                <span>-{formatCurrency(discount, currency)}</span>
              </div>
            )}
            <div className="flex justify-between text-neutral-700">
              <span>Tax:</span>
              <span>{formatCurrency(taxAmount, currency)}</span>
            </div>
            <div className="flex justify-between border-t border-dashed border-neutral-200 pt-2 font-bold text-neutral-900">
              <span>Total:</span>
              <span className="text-lg">{formatCurrency(total, currency)}</span>
            </div>
          </div>

          {/* Payment Info */}
          <div className="space-y-2 border-b border-neutral-200 pb-4 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-700">Payment Method:</span>
              <span className="font-medium text-neutral-900">
                {paymentLabel}
              </span>
            </div>
            {amountTendered !== null && (
              <>
                <div className="flex justify-between text-neutral-700">
                  <span>Amount Tendered:</span>
                  <span>{formatCurrency(amountTendered, currency)}</span>
                </div>
                <div className="flex justify-between border-t border-dashed border-neutral-200 pt-2 font-semibold text-success-700">
                  <span>Change:</span>
                  <span>{formatCurrency(changeAmount, currency)}</span>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="space-y-2 text-center">
            <p className="text-xs text-neutral-500">
              Thank you for your purchase!
            </p>
            <p className="text-xs text-neutral-400">
              Please keep this receipt for your records.
            </p>
          </div>
        </div>
      </div>

      <ModalFooter>
        <Button onClick={handlePrint} variant="outline" className="flex-1">
          Print Receipt
        </Button>
        <Button onClick={onClose} className="flex-1">
          Close & Continue
        </Button>
      </ModalFooter>
    </Modal>
  );
}

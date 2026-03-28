import { useEffect, useRef, useState, useCallback } from "react";

interface BarcodeScannerOptions {
  onBarcode: (barcode: string) => void;
  onError?: (error: Error) => void;
}

export function useBarcodeScanner({ onBarcode }: BarcodeScannerOptions) {
  const barcodeBufferRef = useRef<string>("");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isListening, setIsListening] = useState(true);

  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (!isListening) return;

      // Don't capture input from text fields
      const target = event.target as HTMLElement | null;
      const isDisabledTarget =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (isDisabledTarget) {
        // Allow barcode scanners to work in input fields by checking for quick input
        // Most barcode scanners input very quickly (within 50ms between characters)
        // and usually end with Enter
        if (event.key === "Enter") {
          const inputElement = target as HTMLInputElement;
          const text = inputElement.value;
          // Only treat as barcode if it looks like a barcode (numbers, reasonable length)
          if (text && text.length > 5 && /^[0-9a-zA-Z\-_]+$/.test(text)) {
            onBarcode(text);
            inputElement.value = "";
            event.preventDefault();
            return;
          }
        } else if (event.key !== "Tab" && event.key !== "Backspace") {
          // Track input for barcode detection
          return;
        } else {
          return;
        }
      }

      // Clear timeout and buffer on non-numeric input
      if (
        !event.key.match(/^[0-9a-zA-Z\-_]$/) &&
        event.key !== "Enter" &&
        event.key !== "Tab"
      ) {
        barcodeBufferRef.current = "";
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        return;
      }

      // Handle Enter key as end of barcode
      if (event.key === "Enter") {
        if (barcodeBufferRef.current) {
          event.preventDefault();
          onBarcode(barcodeBufferRef.current);
          barcodeBufferRef.current = "";
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
        }
        return;
      }

      // Handle Tab key as end of barcode (some scanners use Tab instead)
      if (event.key === "Tab") {
        if (barcodeBufferRef.current) {
          event.preventDefault();
          onBarcode(barcodeBufferRef.current);
          barcodeBufferRef.current = "";
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
        }
        return;
      }

      // Add character to buffer
      barcodeBufferRef.current += event.key.toUpperCase();

      // Clear previous timeout
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      // Set new timeout - if no input for 100ms, treat as complete barcode
      // Most barcode scanners input all characters within 50ms
      timeoutRef.current = setTimeout(() => {
        if (barcodeBufferRef.current && barcodeBufferRef.current.length > 2) {
          onBarcode(barcodeBufferRef.current);
          barcodeBufferRef.current = "";
        }
      }, 100);
    },
    [onBarcode, isListening],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [handleKeyPress]);

  return {
    isListening,
    setIsListening,
  };
}

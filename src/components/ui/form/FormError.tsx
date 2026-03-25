"use client";

import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface FormErrorProps {
  message?: string | null;
  className?: string;
}

export function FormError({ message, className }: FormErrorProps) {
  if (!message) return null;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 text-xs font-medium text-danger-600",
        className,
      )}
    >
      <AlertCircle size={14} className="flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}

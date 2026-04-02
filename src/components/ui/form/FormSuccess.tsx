"use client";

import { cn } from "@/lib/utils/cn";
import { CheckCircle2 } from "lucide-react";

interface FormSuccessProps {
  message?: string | null;
  className?: string;
}

export function FormSuccess({ message, className }: FormSuccessProps) {
  if (!message) return null;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-md bg-success-50 px-3 py-2 text-sm text-success-700",
        className,
      )}
    >
      <CheckCircle2 size={16} className="shrink-0" />
      <span>{message}</span>
    </div>
  );
}

"use client";

import { cn } from "@/lib/utils/cn";

interface FormHelpProps {
  message?: string;
  className?: string;
}

export function FormHelp({ message, className }: FormHelpProps) {
  if (!message) return null;

  return (
    <p className={cn("text-xs text-neutral-500", className)}>
      {message}
    </p>
  );
}

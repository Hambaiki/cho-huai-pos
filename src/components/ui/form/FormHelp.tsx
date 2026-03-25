"use client";

import { cn } from "@/lib/utils/cn";

interface FormHelpProps {
  children?: React.ReactNode;
  className?: string;
}

export function FormHelp({ children, className }: FormHelpProps) {
  if (!children) return null;

  return (
    <p className={cn("text-xs text-neutral-500", className)}>{children}</p>
  );
}

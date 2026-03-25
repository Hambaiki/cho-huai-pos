"use client";

import { cn } from "@/lib/utils/cn";

interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  children: React.ReactNode;
}

export function FormLabel({
  required = false,
  children,
  className,
  ...props
}: FormLabelProps) {
  return (
    <label
      className={cn(
        "inline-flex items-center gap-1.5 text-sm font-medium text-neutral-700",
        className,
      )}
      {...props}
    >
      {children}
      {required && <span className="text-danger-600">*</span>}
    </label>
  );
}

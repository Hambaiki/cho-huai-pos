"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

interface FormInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  isLoading?: boolean;
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ className, type = "text", error, isLoading, disabled, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(
          "block w-full rounded-md border border-neutral-200 px-3 py-2 text-sm",
          "text-neutral-900 placeholder-neutral-400",
          "outline-none transition-colors",
          "focus:border-brand-300 focus:ring-2 focus:ring-brand-200",
          "disabled:bg-neutral-50 disabled:text-neutral-500 disabled:cursor-not-allowed",
          error && "border-danger-300 focus:ring-danger-200 focus:border-danger-300",
          className,
        )}
        {...props}
      />
    );
  },
);

FormInput.displayName = "FormInput";

export { FormInput };

"use client";

import { forwardRef, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { ChevronDown } from "lucide-react";

interface FormSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  isLoading?: boolean;
  options?: Array<{ value: string; label: ReactNode }>;
  children?: ReactNode;
}

const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  (
    {
      className,
      error,
      isLoading,
      disabled,
      options,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          disabled={disabled || isLoading}
          className={cn(
            "block w-full rounded-md border border-neutral-200 px-3 py-2 pr-10 text-sm",
            "text-neutral-900 bg-white appearance-none cursor-pointer",
            "outline-none transition-colors",
            "focus:border-brand-300 focus:ring-2 focus:ring-brand-200",
            "disabled:bg-neutral-50 disabled:text-neutral-500 disabled:cursor-not-allowed",
            error && "border-danger-300 focus:ring-danger-200 focus:border-danger-300",
            className,
          )}
          {...props}
        >
          {children}
          {options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-neutral-500"
        />
      </div>
    );
  },
);

FormSelect.displayName = "FormSelect";

export { FormSelect };

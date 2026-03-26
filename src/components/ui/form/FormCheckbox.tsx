"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";
import { Check } from "lucide-react";

interface FormCheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
}

const FormCheckbox = forwardRef<HTMLInputElement, FormCheckboxProps>(
  ({ className, label, disabled, ...props }, ref) => {
    return (
      <label
        className={cn(
          "inline-flex items-center gap-3 cursor-pointer",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <div
          className={cn(
            "relative shrink-0 w-5 h-5 rounded border-2 border-neutral-300 transition-colors",
            "has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-brand-200 has-[input:focus-visible]:ring-offset-1",
            "has-[input:checked]:bg-brand-600 has-[input:checked]:border-brand-600",
            className,
          )}
        >
          <input
            ref={ref}
            type="checkbox"
            disabled={disabled}
            className="sr-only peer"
            {...props}
          />
          <Check
            size={16}
            className="absolute inset-0 w-full h-full p-1 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"
          />
        </div>
        {label && (
          <span className="text-sm font-medium text-neutral-900 select-none">
            {label}
          </span>
        )}
      </label>
    );
  },
);

FormCheckbox.displayName = "FormCheckbox";

export { FormCheckbox };

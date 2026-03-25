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
      <label className="inline-flex items-center gap-3 cursor-pointer">
        <div className="relative">
          <input
            ref={ref}
            type="checkbox"
            disabled={disabled}
            className="sr-only"
            {...props}
          />
          <div
            className={cn(
              "w-5 h-5 rounded border-2 border-neutral-300 transition-colors",
              "focus-within:ring-2 focus-within:ring-brand-200",
              "disabled:bg-neutral-100 disabled:cursor-not-allowed",
              "has-[input:checked]:bg-brand-600 has-[input:checked]:border-brand-600",
              className,
            )}
          >
            <Check
              size={16}
              className="w-full h-full p-0.5 text-white opacity-0 has-[input:checked]:opacity-100 transition-opacity pointer-events-none"
            />
          </div>
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

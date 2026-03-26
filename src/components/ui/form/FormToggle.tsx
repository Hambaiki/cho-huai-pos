"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

export interface FormToggleProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onChange" | "value"
> {
  value?: boolean;
  onChange?: (value: boolean) => void;
  disabled?: boolean;
}

/**
 * FormToggle is a controlled toggle/switch component for boolean values.
 * Works like a checkbox but with a visual toggle switch design.
 *
 * @example
 * ```tsx
 * const [enabled, setEnabled] = useState(false);
 *
 * <FormToggle
 *   value={enabled}
 *   onChange={setEnabled}
 *   disabled={isLoading}
 * />
 * ```
 */
const FormToggle = forwardRef<HTMLButtonElement, FormToggleProps>(
  ({ value = false, onChange, disabled = false, className, ...props }, ref) => {
    const handleClick = () => {
      if (!disabled) {
        onChange?.(!value);
      }
    };

    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={value}
        disabled={disabled}
        onClick={handleClick}
        className={cn(
          "relative inline-flex h-6 w-10 rounded-full p-0 transition-colors",
          // Enabled state
          value ? "bg-brand-600" : "bg-neutral-300",
          // Hover state (only when not disabled)
          !disabled && (value ? "hover:bg-brand-700" : "hover:bg-neutral-400"),
          // Disabled state
          disabled && "cursor-not-allowed opacity-60",
          // Active state
          !disabled && "cursor-pointer",
          className,
        )}
        {...props}
      >
        {/* Toggle indicator */}
        <span
          className={cn(
            "inline-block h-4 w-4 rounded-full bg-white shadow transition-transform",
            value ? "translate-x-5" : "translate-x-1",
            // Adjust vertical centering
            "mt-1",
          )}
        />
      </button>
    );
  },
);

FormToggle.displayName = "FormToggle";

export { FormToggle };

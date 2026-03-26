"use client";

import {
  forwardRef,
  useId,
  useRef,
  useState,
  useEffect,
  useCallback,
  useImperativeHandle,
  ReactNode,
  Children,
  isValidElement,
  useMemo,
} from "react";
import { cn } from "@/lib/utils/cn";
import { CheckIcon, ChevronDown } from "lucide-react";
import { FormSelectOption, FormSelectOptionProps } from "./FormSelectOption";

export interface SelectOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

export interface FormSelectProps {
  className?: string;
  wrapperClassName?: string;
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  options?: SelectOption[];
  onChange?: (value: string) => void;
  onBlur?: () => void;
  error?: boolean;
  disabled?: boolean;
  isLoading?: boolean;
  required?: boolean;
  children?: ReactNode;
}

const FormSelect = forwardRef<HTMLButtonElement, FormSelectProps>(
  (
    {
      id,
      name,
      value,
      defaultValue,
      onChange,
      error,
      disabled,
      isLoading,
      placeholder = "Select…",
      options = [],
      className,
      wrapperClassName,
      children,
    },
    ref,
  ) => {
    const autoId = useId();
    const inputId = id ?? autoId;

    // NOTE: extract SelectOption from FormSelectOption children
    const extractedOptions = useMemo(() => {
      const childOptions: SelectOption[] = [];

      Children.toArray(children).forEach((child) => {
        if (isValidElement<FormSelectOptionProps>(child)) {
          if (child.type === FormSelectOption) {
            const props = child.props as FormSelectOptionProps;
            childOptions.push({
              value: props.value,
              label: props.children,
              disabled: props.disabled,
            });
          }
        }
      });

      return childOptions;
    }, [children]);

    // NOTE: merge options from prop and children, children take precedence
    const allOptions = useMemo(
      () => (extractedOptions.length > 0 ? extractedOptions : options),
      [extractedOptions, options],
    );

    // NOTE: manage controlled vs uncontrolled value
    const [internalValue, setInternalValue] = useState(
      defaultValue ?? value ?? "",
    );

    const selectedValue = value !== undefined ? value : internalValue;
    const selectedOption = allOptions.find((o) => o.value === selectedValue);

    // NOTE: open state is always internal
    const [open, setOpen] = useState(false);
    const close = useCallback(() => setOpen(false), []);

    const containerRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    useImperativeHandle(ref, () => buttonRef.current!);

    // NOTE: activeIndex for keyboard navigation
    const [keyboardIndex, setKeyboardIndex] = useState<number>(-1);

    const selectedIndex = useMemo(() => {
      return allOptions.findIndex(
        (o) => o.value === selectedValue && !o.disabled,
      );
    }, [allOptions, selectedValue]);

    const activeIndex = useMemo(() => {
      if (!open) return -1;
      if (keyboardIndex >= 0) return keyboardIndex;
      return selectedIndex >= 0 ? selectedIndex : 0;
    }, [open, keyboardIndex, selectedIndex]);

    useEffect(() => {
      if (!open) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setKeyboardIndex(-1);
      }
    }, [open]);
    useEffect(() => {
      if (!open) return;

      const handler = (e: MouseEvent) => {
        if (!containerRef.current?.contains(e.target as Node)) {
          close();
        }
      };

      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, [open, close]);

    // NOTE: close dropdown on focus out
    useEffect(() => {
      if (!open) return;

      const handleFocusOut = (e: FocusEvent) => {
        if (container && !container.contains(e.relatedTarget as Node)) {
          close();
        }
      };

      const container = containerRef.current;
      container?.addEventListener("focusout", handleFocusOut);

      return () => container?.removeEventListener("focusout", handleFocusOut);
    }, [open, close]);

    // NOTE: handle option selection
    const select = (opt: SelectOption) => {
      if (opt.disabled) return;

      if (value === undefined) {
        setInternalValue(opt.value);
      }

      onChange?.(opt.value);
      close();
      buttonRef.current?.focus();
    };

    // NOTE: handle keyboard events on trigger button
    const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
      if (disabled || isLoading) return;

      switch (e.key) {
        case "ArrowDown":
        case "ArrowUp":
        case "Enter":
        case " ":
          e.preventDefault();
          setOpen(true);
          break;
        case "Escape":
          close();
          break;
      }
    };

    // NOTE: handle keyboard events in dropdown
    const handleDropdownKeyDown = (e: React.KeyboardEvent) => {
      if (!open) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setKeyboardIndex((i) => Math.min(i + 1, allOptions.length - 1));
          break;

        case "ArrowUp":
          e.preventDefault();
          setKeyboardIndex((i) => Math.max(i - 1, 0));
          break;

        case "Enter": {
          e.preventDefault();
          const opt = allOptions[activeIndex];
          if (opt && !opt.disabled) select(opt);
          break;
        }

        case "Escape":
        case "Tab":
          close();
          break;
      }
    };

    const isDisabledOrLoading = disabled || isLoading;

    return (
      <div
        ref={containerRef}
        onKeyDown={handleDropdownKeyDown}
        className={cn("w-full flex flex-col", wrapperClassName)}
      >
        {/* Hidden native input for forms */}
        <input type="hidden" name={name} value={selectedValue} />

        {/* Trigger */}
        <div className="relative w-full">
          <button
            ref={buttonRef}
            id={inputId}
            type="button"
            role="combobox"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={`${inputId}-listbox`}
            aria-invalid={!!error}
            disabled={isDisabledOrLoading}
            onClick={() => !isDisabledOrLoading && setOpen((o) => !o)}
            onKeyDown={handleTriggerKeyDown}
            className={cn(
              "block w-full rounded-md border px-3 py-2 pr-10 text-sm",
              "text-left appearance-none cursor-pointer",
              "outline-none transition-colors",
              // Default state
              "border-neutral-200 text-neutral-900 bg-white",
              // Hover state
              !isDisabledOrLoading && "hover:border-neutral-300",
              // Focus state
              !isDisabledOrLoading &&
                "focus:border-brand-300 focus:ring-2 focus:ring-brand-200",
              // Error state
              error &&
                !isDisabledOrLoading &&
                "border-danger-300 focus:ring-danger-200 focus:border-danger-300",
              // Disabled/Loading state
              isDisabledOrLoading &&
                "bg-neutral-50 text-neutral-500 cursor-not-allowed",
              // Placeholder text color
              !selectedOption && "text-neutral-400",
              className,
            )}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </button>

          {/* Chevron */}
          <div
            className={cn(
              "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 transition-transform",
              open ? "rotate-180" : "rotate-0",
              isDisabledOrLoading ? "text-neutral-400" : "text-neutral-500",
            )}
          >
            <ChevronDown size={16} />
          </div>

          {/* Dropdown */}
          {open && (
            <ul
              id={`${inputId}-listbox`}
              role="listbox"
              className={cn(
                "absolute z-50 mt-2 w-full",
                "rounded-md border border-neutral-200 bg-white shadow-lg",
                "p-1 space-y-0 outline-none",
              )}
            >
              {allOptions.length === 0 ? (
                <li className="px-3 py-2 text-sm text-neutral-500">
                  No options available
                </li>
              ) : (
                allOptions.map((opt, index) => {
                  const isSelected = opt.value === selectedValue;
                  const isActive = index === activeIndex;

                  return (
                    <li
                      key={opt.value}
                      role="option"
                      aria-selected={isSelected}
                      aria-disabled={opt.disabled}
                      onMouseEnter={() => setKeyboardIndex(index)}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => select(opt)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 text-sm",
                        "rounded cursor-pointer select-none transition-colors",

                        // Selected state
                        isSelected &&
                          !opt.disabled &&
                          "bg-neutral-100 text-brand-600 font-medium",
                        // Active/hovering state
                        isActive && !opt.disabled && "bg-neutral-200",
                        // Disabled state
                        opt.disabled &&
                          "text-neutral-400 cursor-not-allowed opacity-50",
                        // Default text color
                        !opt.disabled && "text-neutral-900",
                      )}
                    >
                      <span className="w-4 h-4 flex items-center justify-center shrink-0">
                        {isSelected && (
                          <CheckIcon size={16} className="text-brand-600" />
                        )}
                      </span>
                      <span className="flex-1">{opt.label}</span>
                    </li>
                  );
                })
              )}
            </ul>
          )}
        </div>
      </div>
    );
  },
);

FormSelect.displayName = "FormSelect";

export { FormSelect };

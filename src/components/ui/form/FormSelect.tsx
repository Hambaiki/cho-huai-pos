"use client";

import { cn } from "@/lib/utils/cn";
import { CheckIcon, ChevronDown } from "lucide-react";
import {
  Children,
  ReactNode,
  forwardRef,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
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

interface DropdownPosition {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  openUpward: boolean;
}

const VIEWPORT_PADDING = 8;
const DROPDOWN_GAP = 8;
const MIN_DROPDOWN_HEIGHT = 80;

const FormSelect = forwardRef<HTMLButtonElement, FormSelectProps>(
  (
    {
      id,
      name,
      value,
      defaultValue,
      onChange,
      onBlur,
      error,
      disabled,
      isLoading,
      placeholder = "Select...",
      options = [],
      className,
      wrapperClassName,
      children,
    },
    ref,
  ) => {
    const autoId = useId();
    const inputId = id ?? autoId;

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

    const allOptions = useMemo(
      () => (extractedOptions.length > 0 ? extractedOptions : options),
      [extractedOptions, options],
    );

    const [internalValue, setInternalValue] = useState(
      defaultValue ?? value ?? "",
    );

    const selectedValue = value !== undefined ? value : internalValue;
    const selectedOption = allOptions.find((o) => o.value === selectedValue);

    const [open, setOpen] = useState(false);
    const [keyboardIndex, setKeyboardIndex] = useState<number>(-1);

    const close = useCallback(() => {
      setKeyboardIndex(-1);
      setOpen(false);
      onBlur?.();
    }, [onBlur]);

    const containerRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLUListElement>(null);

    useImperativeHandle(ref, () => buttonRef.current!);

    const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition>({
      top: 0,
      left: 0,
      width: 0,
      maxHeight: 240,
      openUpward: false,
    });

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

    const updateDropdownPosition = useCallback(() => {
      const trigger = buttonRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const availableBelow = viewportHeight - rect.bottom - DROPDOWN_GAP;
      const availableAbove = rect.top - DROPDOWN_GAP;
      const openUpward =
        availableBelow < MIN_DROPDOWN_HEIGHT && availableAbove > availableBelow;

      const maxLeft = Math.max(
        VIEWPORT_PADDING,
        viewportWidth - rect.width - VIEWPORT_PADDING,
      );
      const left = Math.min(Math.max(rect.left, VIEWPORT_PADDING), maxLeft);

      const top = openUpward
        ? Math.max(VIEWPORT_PADDING, rect.top - DROPDOWN_GAP)
        : Math.min(
            viewportHeight - VIEWPORT_PADDING,
            rect.bottom + DROPDOWN_GAP,
          );

      const availableHeight = openUpward ? availableAbove : availableBelow;

      setDropdownPosition({
        top,
        left,
        width: rect.width,
        maxHeight: Math.max(MIN_DROPDOWN_HEIGHT, availableHeight),
        openUpward,
      });
    }, []);

    useLayoutEffect(() => {
      if (!open) return;
      updateDropdownPosition();
    }, [open, updateDropdownPosition]);

    useEffect(() => {
      if (!open) return;

      const handleReposition = () => updateDropdownPosition();
      window.addEventListener("resize", handleReposition);
      window.addEventListener("scroll", handleReposition, true);

      return () => {
        window.removeEventListener("resize", handleReposition);
        window.removeEventListener("scroll", handleReposition, true);
      };
    }, [open, updateDropdownPosition]);

    useEffect(() => {
      if (!open) return;

      const handleOutsidePointerDown = (e: MouseEvent) => {
        const target = e.target as Node;
        const insideTrigger = containerRef.current?.contains(target);
        const insideDropdown = dropdownRef.current?.contains(target);

        if (!insideTrigger && !insideDropdown) {
          close();
        }
      };

      document.addEventListener("mousedown", handleOutsidePointerDown);
      return () =>
        document.removeEventListener("mousedown", handleOutsidePointerDown);
    }, [open, close]);

    useEffect(() => {
      if (!open) return;

      const handleFocusIn = (e: FocusEvent) => {
        const target = e.target as Node;
        const insideTrigger = containerRef.current?.contains(target);
        const insideDropdown = dropdownRef.current?.contains(target);

        if (!insideTrigger && !insideDropdown) {
          close();
        }
      };

      document.addEventListener("focusin", handleFocusIn);
      return () => document.removeEventListener("focusin", handleFocusIn);
    }, [open, close]);

    const select = (opt: SelectOption) => {
      if (opt.disabled) return;

      if (value === undefined) {
        setInternalValue(opt.value);
      }

      onChange?.(opt.value);
      close();
      buttonRef.current?.focus();
    };

    const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
      if (disabled || isLoading) return;

      switch (e.key) {
        case "ArrowDown":
        case "ArrowUp":
        case "Enter":
        case " ":
          e.preventDefault();
          setKeyboardIndex(-1);
          setOpen(true);
          break;
        case "Escape":
          close();
          break;
      }
    };

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
        <input type="hidden" name={name} value={selectedValue} />

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
            onClick={() => {
              if (isDisabledOrLoading) return;

              if (open) {
                close();
                return;
              }

              setKeyboardIndex(-1);
              setOpen(true);
            }}
            onKeyDown={handleTriggerKeyDown}
            className={cn(
              "block w-full rounded-md border px-3 py-2 pr-10 text-sm",
              "text-left appearance-none cursor-pointer",
              "outline-none transition-colors",
              "border-neutral-200 text-neutral-900 bg-white",
              !isDisabledOrLoading && "hover:border-neutral-300",
              !isDisabledOrLoading &&
                "focus:border-brand-300 focus:ring-2 focus:ring-brand-200",
              error &&
                !isDisabledOrLoading &&
                "border-danger-300 focus:ring-danger-200 focus:border-danger-300",
              isDisabledOrLoading &&
                "bg-neutral-50 text-neutral-500 cursor-not-allowed",
              !selectedOption && "text-neutral-400",
              className,
            )}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </button>

          <div
            className={cn(
              "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 transition-transform",
              open ? "rotate-180" : "rotate-0",
              isDisabledOrLoading ? "text-neutral-400" : "text-neutral-500",
            )}
          >
            <ChevronDown size={16} />
          </div>

          {open &&
            createPortal(
              <ul
                ref={dropdownRef}
                id={`${inputId}-listbox`}
                role="listbox"
                style={{
                  position: "fixed",
                  top: dropdownPosition.top,
                  left: dropdownPosition.left,
                  width: dropdownPosition.width,
                  maxHeight: dropdownPosition.maxHeight,
                  transform: dropdownPosition.openUpward
                    ? "translateY(-100%)"
                    : undefined,
                }}
                className={cn(
                  "z-1000",
                  "rounded-md border border-neutral-200 bg-white shadow-lg",
                  "p-1 space-y-1 outline-none overflow-y-auto",
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
                          isSelected &&
                            !opt.disabled &&
                            "bg-neutral-100 text-brand-600 font-medium",
                          isActive && !opt.disabled && "bg-neutral-200",
                          opt.disabled &&
                            "text-neutral-400 cursor-not-allowed opacity-50",
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
              </ul>,
              document.body,
            )}
        </div>
      </div>
    );
  },
);

FormSelect.displayName = "FormSelect";

export { FormSelect };

"use client";

import { forwardRef, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Upload } from "lucide-react";

export interface FormFileUploadProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label?: string;
  hint?: string;
  error?: boolean;
  required?: boolean;
  placeholder?: string;
  wrapperClassName?: string;
  isLoading?: boolean;
}

const FormFileUpload = forwardRef<HTMLInputElement, FormFileUploadProps>(
  (
    {
      label,
      hint,
      error,
      required,
      disabled,
      placeholder = "Choose a file...",
      id,
      className,
      wrapperClassName,
      onChange,
      isLoading,
      ...props
    },
    ref,
  ) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const internalRef = useRef<HTMLInputElement | null>(null);
    const [fileName, setFileName] = useState<string>("");

    const setRefs = (el: HTMLInputElement | null) => {
      internalRef.current = el;
      if (typeof ref === "function") ref(el);
      else if (ref) ref.current = el;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.currentTarget.files?.[0];
      setFileName(file?.name ?? "");
      onChange?.(e);
    };

    const isDisabledOrLoading = disabled || isLoading;

    return (
      <div className={cn("flex flex-col gap-2", wrapperClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              "text-sm font-medium",
              required &&
                "after:ml-1 after:text-danger-600 after:content-['*']",
              isDisabledOrLoading && "text-neutral-500",
            )}
          >
            {label}
          </label>
        )}

        <div
          className={cn(
            "relative block w-full rounded-md border border-neutral-200 px-3 py-2",
            "text-sm outline-none transition-colors",
            "focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-200",
            "has-disabled:bg-neutral-50 has-disabled:text-neutral-500 has-disabled:cursor-not-allowed",
            error &&
              "border-danger-300 focus-within:ring-danger-200 focus-within:border-danger-300",
            className,
          )}
        >
          <button
            type="button"
            disabled={isDisabledOrLoading}
            onClick={() => internalRef.current?.click()}
            className={cn(
              "inline-flex items-center gap-2",
              "text-neutral-900",
              isDisabledOrLoading && "text-neutral-500 cursor-not-allowed",
            )}
          >
            <Upload size={16} />
            <span>{fileName || placeholder}</span>
          </button>

          {/* Hidden native input */}
          <input
            ref={setRefs}
            id={inputId}
            type="file"
            disabled={isDisabledOrLoading}
            aria-invalid={error}
            className="sr-only"
            onChange={handleFileChange}
            {...props}
          />
        </div>

        {(hint || error) && (
          <p
            className={cn(
              "text-xs",
              error ? "text-danger-600" : "text-neutral-500",
            )}
          >
            {error || hint}
          </p>
        )}
      </div>
    );
  },
);

FormFileUpload.displayName = "FileUpload";

export { FormFileUpload as FormFileUpload };

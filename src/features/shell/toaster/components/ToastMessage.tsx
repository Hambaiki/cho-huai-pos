"use client";

import { cn } from "@/lib/utils/cn";
import { X } from "lucide-react";
import type { Toast } from "react-hot-toast";
import { toast as hotToast } from "react-hot-toast";
import { iconByVariant } from "../constants";
import { ToastAction, ToastVariant } from "../types";

interface ToastMessageProps {
  toast: Toast;
  title: string;
  description?: string;
  variant: ToastVariant;
  action?: ToastAction;
  dismissible?: boolean;
  className?: string;
}

export function ToastMessage({
  toast,
  title,
  description,
  variant,
  action,
  dismissible = true,
  className,
}: ToastMessageProps) {
  const Icon = iconByVariant[variant];

  const handleAction = () => {
    action?.onClick();
    hotToast.dismiss(toast.id);
  };

  const isVisible = toast.visible;

  return (
    <div
      className={cn(
        "pointer-events-auto w-[min(92vw,420px)] rounded-xl border p-3 shadow-lg",
        variant === "default" && "border-neutral-200 bg-white text-neutral-900",
        variant === "success" &&
          "border-success-200 bg-success-50 text-success-700",
        variant === "error" && "border-danger-200 bg-danger-50 text-danger-700",
        variant === "warning" &&
          "border-warning-200 bg-warning-50 text-warning-700",
        variant === "info" && "border-info-200 bg-info-50 text-info-700",
        className,
      )}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible
          ? "translateY(0) scale(1)"
          : "translateY(12px) scale(0.95)",
        transition: "all 0.22s cubic-bezier(0.22, 1, 0.36, 1)",
        pointerEvents: isVisible ? "auto" : "none",
      }}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 shrink-0" />

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-5">{title}</p>
          {description ? (
            <p className="mt-1 text-xs leading-4 text-neutral-600">
              {description}
            </p>
          ) : null}

          {action ? (
            <button
              type="button"
              onClick={handleAction}
              className="mt-2 inline-flex items-center rounded-md border border-current/25 px-3 py-1 text-xs font-medium transition-colors hover:bg-black/5"
            >
              {action.label}
            </button>
          ) : null}
        </div>

        {dismissible ? (
          <button
            type="button"
            onClick={() => hotToast.dismiss(toast.id)}
            className="rounded-md p-1 transition-colors hover:bg-black/5"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

export type { ToastAction, ToastVariant };

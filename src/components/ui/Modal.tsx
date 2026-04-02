"use client";

import { cn } from "@/lib/utils/cn";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Phase = "visible" | "exiting" | "hidden";

const SIZE_MAP: Record<string, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
};

// ── Root ────────────────────────────────────────────────────────────────────

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Max-width of the dialog panel. Default: "md" */
  size?: keyof typeof SIZE_MAP;
  /** Extra classes forwarded to the panel element */
  className?: string;
  /** Render edge-to-edge full-screen panel */
  fullScreen?: boolean;
}

export function Modal({
  open,
  onClose,
  children,
  size = "md",
  className,
  fullScreen = false,
}: ModalProps) {
  const [phase, setPhase] = useState<Phase>(open ? "visible" : "hidden");

  // Freeze the last children seen while the modal was open so content
  // remains visible throughout the exit animation, regardless of what
  // the parent renders while open=false.
  const childrenSnapshot = useRef(children);
  if (open) {
    childrenSnapshot.current = children;
  }

  useEffect(() => {
    if (open) {
      setPhase("visible");
    } else if (phase === "visible") {
      setPhase("exiting");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Escape key dismissal
  useEffect(() => {
    if (phase !== "visible") return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [phase, onClose]);

  if (phase === "hidden") return null;

  const isExiting = phase === "exiting";
  const panelAnimationClass = fullScreen
    ? isExiting
      ? "animate-modal-backdrop-out"
      : "animate-modal-backdrop-in"
    : isExiting
      ? "animate-modal-panel-out"
      : "animate-modal-panel-in";

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className={cn(
        "fixed inset-0 z-50 grid place-items-center",
        fullScreen ? "p-0" : "p-4",
        isExiting ? "animate-modal-backdrop-out" : "animate-modal-backdrop-in",
      )}
      style={{ backgroundColor: "rgb(15 23 42 / 0.45)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          "w-full overflow-hidden rounded-2xl border border-border bg-surface shadow-xl",
          SIZE_MAP[size] ?? SIZE_MAP.md,
          fullScreen && "h-dvh max-w-none rounded-none border-0 shadow-none",
          panelAnimationClass,
          className,
        )}
        onAnimationEnd={(e) => {
          if (e.currentTarget === e.target && isExiting) setPhase("hidden");
        }}
      >
        {childrenSnapshot.current}
      </div>
    </div>,
    document.body,
  );
}

// ── Header ─────────────────────────────────────────────────────────────────

interface ModalHeaderProps {
  title: string;
  description?: string;
  onClose?: () => void;
  className?: string;
}

export function ModalHeader({
  title,
  description,
  onClose,
  className,
}: ModalHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 border-b border-border px-5 py-4",
        className,
      )}
    >
      <div>
        <h3 className="text-base font-semibold text-neutral-900">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-neutral-500">{description}</p>
        )}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="mt-1 rounded-md p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-600 cursor-pointer"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

// ── Body ────────────────────────────────────────────────────────────────────

interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalBody({ children, className }: ModalBodyProps) {
  return <div className={cn("px-5 py-4", className)}>{children}</div>;
}

// ── Footer ──────────────────────────────────────────────────────────────────

interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-2 border-t border-border px-5 py-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

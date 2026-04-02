"use client";

import { cn } from "@/lib/utils/cn";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Phase = "visible" | "exiting" | "hidden";
type Side = "left" | "right" | "top" | "bottom";

// ── Animation classes per side ───────────────────────────────────────────────

const SIDE_CLASSES: Record<
  Side,
  { panel: string; enterAnim: string; exitAnim: string }
> = {
  right: {
    panel: "inset-y-0 right-0 h-full",
    enterAnim: "animate-drawer-right-in",
    exitAnim: "animate-drawer-right-out",
  },
  left: {
    panel: "inset-y-0 left-0 h-full",
    enterAnim: "animate-drawer-left-in",
    exitAnim: "animate-drawer-left-out",
  },
  bottom: {
    panel: "inset-x-0 bottom-0 w-full",
    enterAnim: "animate-drawer-bottom-in",
    exitAnim: "animate-drawer-bottom-out",
  },
  top: {
    panel: "inset-x-0 top-0 w-full",
    enterAnim: "animate-drawer-top-in",
    exitAnim: "animate-drawer-top-out",
  },
};

const SIZE_MAP: Record<string, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
};

const SIZE_MAP_VERTICAL: Record<string, string> = {
  sm: "max-h-[30vh]",
  md: "max-h-[45vh]",
  lg: "max-h-[60vh]",
  xl: "max-h-[75vh]",
  "2xl": "max-h-[90vh]",
};

// ── Root ─────────────────────────────────────────────────────────────────────

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Which edge the drawer slides in from. Default: "right" */
  side?: Side;
  /**
   * For left/right drawers: controls max-width.
   * For top/bottom drawers: controls max-height.
   * Default: "md"
   */
  size?: keyof typeof SIZE_MAP;
  /** Extra classes forwarded to the panel element */
  className?: string;
}

export function Drawer({
  open,
  onClose,
  children,
  side = "right",
  size = "md",
  className,
}: DrawerProps) {
  const [phase, setPhase] = useState<Phase>(open ? "visible" : "hidden");

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
  const { panel, enterAnim, exitAnim } = SIDE_CLASSES[side];
  const isVertical = side === "top" || side === "bottom";
  const sizeClass = isVertical ? SIZE_MAP_VERTICAL[size] : SIZE_MAP[size];

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className={cn(
        "fixed inset-0 z-50",
        isExiting ? "animate-modal-backdrop-out" : "animate-modal-backdrop-in",
      )}
      style={{ backgroundColor: "rgb(15 23 42 / 0.45)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          // Base
          "absolute flex flex-col overflow-hidden border-border bg-surface shadow-xl",
          // Positioning & sizing
          panel,
          sizeClass,
          // Rounded corners on the inward-facing edge only
          side === "right" && "rounded-l-2xl border-l",
          side === "left" && "rounded-r-2xl border-r",
          side === "bottom" && "rounded-t-2xl border-t",
          side === "top" && "rounded-b-2xl border-b",
          // Animation
          isExiting ? exitAnim : enterAnim,
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

// ── Header ────────────────────────────────────────────────────────────────────

interface DrawerHeaderProps {
  title: string;
  description?: string;
  onClose?: () => void;
  className?: string;
}

export function DrawerHeader({
  title,
  description,
  onClose,
  className,
}: DrawerHeaderProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4",
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

// ── Body ───────────────────────────────────────────────────────────────────────

interface DrawerBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function DrawerBody({ children, className }: DrawerBodyProps) {
  return (
    <div className={cn("min-h-0 flex-1 overflow-y-auto px-5 py-4", className)}>
      {children}
    </div>
  );
}

// ── Footer ─────────────────────────────────────────────────────────────────────

interface DrawerFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function DrawerFooter({ children, className }: DrawerFooterProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-end gap-2 border-t border-border px-5 py-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

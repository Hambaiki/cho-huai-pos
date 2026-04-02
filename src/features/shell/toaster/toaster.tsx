"use client";

import { toast as hotToast, type ToastPosition } from "react-hot-toast";
import {
  ToastMessage,
  type ToastAction,
  type ToastVariant,
} from "./components/ToastMessage";
import { VARIANT_SOUNDS } from "./constants";

export interface AppToastOptions {
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  position?: ToastPosition;
  id?: string;
  action?: ToastAction;
  dismissible?: boolean;
  className?: string;
  sound?: boolean;
}

function playNotificationSound(variant: ToastVariant) {
  try {
    const audioPath = VARIANT_SOUNDS[variant];
    const audio = new Audio(audioPath);
    audio.volume = 1;
    audio.play().catch(() => {
      // Silently fail if audio can't play (e.g., muted browser, no permission)
    });
  } catch {
    // Silently fail if audio initialization fails
  }
}

function show(title: string, options: AppToastOptions = {}) {
  const {
    description,
    variant = "default",
    duration = 4000,
    position,
    id,
    action,
    dismissible = true,
    className,
    sound = false,
  } = options;

  if (sound) {
    playNotificationSound(variant);
  }

  return hotToast.custom(
    (t) => (
      <ToastMessage
        toast={t}
        title={title}
        description={description}
        variant={variant}
        action={action}
        dismissible={dismissible}
        className={className}
      />
    ),
    {
      id,
      position,
      duration,
    },
  );
}

export const toast = {
  show,
  success: (title: string, options: Omit<AppToastOptions, "variant"> = {}) =>
    show(title, { ...options, variant: "success" }),
  error: (title: string, options: Omit<AppToastOptions, "variant"> = {}) =>
    show(title, { ...options, variant: "error" }),
  warning: (title: string, options: Omit<AppToastOptions, "variant"> = {}) =>
    show(title, { ...options, variant: "warning" }),
  info: (title: string, options: Omit<AppToastOptions, "variant"> = {}) =>
    show(title, { ...options, variant: "info" }),
  dismiss: (id?: string) => hotToast.dismiss(id),
  remove: (id?: string) => hotToast.remove(id),
};

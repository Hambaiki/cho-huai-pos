import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { ToastVariant } from "./types";

export const iconByVariant: Record<ToastVariant, typeof CheckCircle2> = {
  default: Info,
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

// Sound file mapping for each variant
// Download these files and place them in /public/audio/ with the exact names below
export const VARIANT_SOUNDS: Record<ToastVariant, string> = {
  default: "/audio/notification-default.mp3",
  success: "/audio/notification-success.mp3",
  error: "/audio/notification-error.mp3",
  warning: "/audio/notification-warning.mp3",
  info: "/audio/notification-info.mp3",
};

import Image from "next/image";
import { cn } from "@/lib/utils/cn";

type LogoVariant =
  | "icon"
  | "full-light"
  | "full-dark"
  | "text-light"
  | "text-dark";
type LogoSize = "xs" | "sm" | "md" | "lg" | "xl" | number;

interface LogoProps {
  /**
   * icon  — square logo only, no text
   * light — full logo with text, for dark backgrounds
   * dark  — full logo with text, for light backgrounds
   * text-light — text-only logo for dark backgrounds
   * text-dark  — text-only logo for light backgrounds
   */
  variant?: LogoVariant;
  size?: LogoSize;
  className?: string;
  priority?: boolean;
  alt?: string;
}

const SIZE_MAP: Record<string, number> = {
  xs: 24,
  sm: 32,
  md: 48,
  lg: 64,
  xl: 96,
};

/** Resolve named size → pixel height */
function resolveSize(size: LogoSize): number {
  if (typeof size === "number") return size;
  return SIZE_MAP[size] ?? SIZE_MAP.md;
}

/**
 * Aspect ratio of the full-text logos (width ÷ height).
 * Adjust this to match your actual SVG viewBox if needed.
 */
const TEXT_LOGO_ASPECT = 4; // e.g. 192w × 48h

export function Logo({
  variant = "icon",
  size = "md",
  className,
  priority = false,
  alt = "Cho-Huai POS",
}: LogoProps) {
  const h = resolveSize(size);

  if (variant === "icon") {
    return (
      <Image
        src="/logo/cho-huai-pos.svg"
        alt={alt}
        width={h}
        height={h}
        priority={priority}
        className={cn("shrink-0", className)}
      />
    );
  }

  if (variant === "full-light") {
    return (
      <Image
        src="/logo/cho-huai-pos-full-light.svg"
        alt={alt}
        width={Math.round(h * TEXT_LOGO_ASPECT)}
        height={h}
        priority={priority}
        className={cn("shrink-0", className)}
      />
    );
  }

  if (variant === "full-dark") {
    return (
      <Image
        src="/logo/cho-huai-pos-full-dark.svg"
        alt={alt}
        width={Math.round(h * TEXT_LOGO_ASPECT)}
        height={h}
        priority={priority}
        className={cn("shrink-0", className)}
      />
    );
  }

  if (variant === "text-light") {
    return (
      <Image
        src="/logo/cho-huai-pos-text-light.svg"
        alt={alt}
        width={Math.round(h * TEXT_LOGO_ASPECT)}
        height={h}
        priority={priority}
        className={cn("shrink-0", className)}
      />
    );
  }

  if (variant === "text-dark") {
    return (
      <Image
        src="/logo/cho-huai-pos-text-dark.svg"
        alt={alt}
        width={Math.round(h * TEXT_LOGO_ASPECT)}
        height={h}
        priority={priority}
        className={cn("shrink-0", className)}
      />
    );
  }
}

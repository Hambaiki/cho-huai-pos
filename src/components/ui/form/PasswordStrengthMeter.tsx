"use client";

import { cn } from "@/lib/utils/cn";

interface PasswordStrengthMeterProps {
  password: string;
}

function getStrength(password: string): { score: number; label: string } {
  if (!password) return { score: 0, label: "" };

  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  const labels = ["Too weak", "Weak", "Fair", "Strong"];
  return { score, label: labels[score - 1] ?? "Too weak" };
}

const SEGMENT_COLORS = [
  "bg-danger-500",
  "bg-amber-400",
  "bg-yellow-400",
  "bg-emerald-500",
];

const LABEL_COLORS = [
  "text-danger-600",
  "text-amber-600",
  "text-yellow-600",
  "text-emerald-600",
];

export function PasswordStrengthMeter({
  password,
}: PasswordStrengthMeterProps) {
  if (!password) return null;

  const { score, label } = getStrength(password);

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors duration-300",
              i < score ? SEGMENT_COLORS[score - 1] : "bg-neutral-200",
            )}
          />
        ))}
      </div>
      <p className={cn("text-xs font-medium", LABEL_COLORS[score - 1])}>
        {label}
      </p>
    </div>
  );
}

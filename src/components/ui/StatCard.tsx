import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type StatCardTone = "default" | "danger";

interface StatCardProps {
  label: string;
  value: ReactNode;
  subLabel?: ReactNode;
  footer?: ReactNode;
  icon?: LucideIcon;
  tone?: StatCardTone;
  className?: string;
}

export function StatCard({
  label,
  value,
  subLabel,
  footer,
  icon: Icon,
  tone = "default",
  className,
}: StatCardProps) {
  const isDanger = tone === "danger";

  return (
    <article
      className={cn(
        "rounded-xl border bg-white p-5",
        isDanger ? "border-danger-200" : "border-neutral-200",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-base font-normal text-neutral-500">{label}</p>
        {Icon ? (
          <span
            className={cn(
              "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
              isDanger
                ? "bg-danger-50 text-danger-600"
                : "bg-brand-50 text-brand-600",
            )}
          >
            <Icon size={18} />
          </span>
        ) : null}
      </div>
      <p
        className={cn(
          "mt-2 text-2xl font-semibold",
          isDanger ? "text-danger-700" : "text-neutral-900",
        )}
      >
        {value}
      </p>
      {subLabel ? (
        <p className="mt-1 text-xs text-neutral-400">{subLabel}</p>
      ) : null}
      {footer ? <div className="mt-3">{footer}</div> : null}
    </article>
  );
}

import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface SectionCardProps {
  title: string;
  children: ReactNode;
  description?: ReactNode;
  headerRight?: ReactNode;
  className?: string;
  headerClassName?: string;
  titleClassName?: string;
  bodyClassName?: string;
}

export function SectionCard({
  title,
  children,
  description,
  headerRight,
  className,
  headerClassName,
  titleClassName,
  bodyClassName,
}: SectionCardProps) {
  return (
    <section
      className={cn("rounded-lg border border-neutral-200 bg-white", className)}
    >
      <div
        className={cn("border-b border-b-border px-4 py-3", headerClassName)}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2
              className={cn(
                "text-base font-semibold text-neutral-800",
                titleClassName,
              )}
            >
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm text-neutral-500">{description}</p>
            ) : null}
          </div>
          {headerRight}
        </div>
      </div>
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </section>
  );
}

import { cn } from "@/lib/utils/cn";
import type { ReactNode } from "react";

interface SectionCardProps {
  children: ReactNode;
  className?: string;
}

export function SectionCard({ children, className }: SectionCardProps) {
  return (
    <section
      className={cn("rounded-lg border border-neutral-200 bg-white", className)}
    >
      {children}
    </section>
  );
}

interface SectionCardHeaderProps {
  title: string | ReactNode;
  description?: string | ReactNode;
  headerRight?: string | ReactNode;
  className?: string;
}

export function SectionCardHeader({
  title,
  description,
  headerRight,
  className,
}: SectionCardHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between border-b border-border px-4 py-3",
        className,
      )}
    >
      <div>
        <h2 className="text-base font-semibold text-neutral-800">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-neutral-500">{description}</p>
        ) : null}
      </div>
      {headerRight}
    </div>
  );
}

interface SectionCardBodyProps {
  children: ReactNode;
  className?: string;
}

export function SectionCardBody({ children, className }: SectionCardBodyProps) {
  return <div className={cn("p-4", className)}>{children}</div>;
}

interface SectionCardFooterProps {
  children: ReactNode;
  className?: string;
}

export function SectionCardFooter({
  children,
  className,
}: SectionCardFooterProps) {
  return (
    <div
      className={cn(
        "border-t border-border px-4 py-3",
        "flex justify-end",
        className,
      )}
    >
      {children}
    </div>
  );
}

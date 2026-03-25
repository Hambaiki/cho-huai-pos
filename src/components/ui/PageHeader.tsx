import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  meta?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({
  title,
  description,
  backHref,
  backLabel,
  meta,
  actions,
}: PageHeaderProps) {
  return (
    <header>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {backHref && (
            <Link
              href={backHref}
              className="flex items-center text-sm text-brand-600 hover:text-brand-800"
            >
              <ChevronLeft className="inline -ml-1"/>
              {backLabel ?? "Back"}
            </Link>
          )}
          <h1
            className={`${backHref ? "mt-1" : ""} text-2xl font-semibold text-neutral-900`}
          >
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-neutral-500">{description}</p>
          )}
        </div>

        {(meta || actions) && (
          <div className="flex flex-col items-start gap-2 sm:items-end">
            {meta}
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}

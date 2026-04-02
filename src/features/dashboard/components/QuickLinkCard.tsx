import { cn } from "@/lib/utils/cn";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export interface QuickLinkCardProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  accent?: string;
}

export function QuickLinkCard({
  href,
  icon,
  title,
  description,
  accent,
}: QuickLinkCardProps) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-4 rounded-2xl border border-neutral-200 bg-white p-5 transition hover:border-brand-300 hover:shadow-sm"
    >
      <span
        className={cn(
          `mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl`,
          !accent ? "bg-brand-50 text-brand-600" : accent,
        )}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-neutral-900">{title}</p>
        <p className="mt-1 text-sm text-neutral-500">{description}</p>
      </div>
      <ArrowRight
        size={16}
        className="mt-1 shrink-0 text-neutral-300 transition group-hover:text-brand-500"
      />
    </Link>
  );
}

"use client";

import { Logo } from "@/components/content/Logo";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import Link from "next/link";
import { useEffect } from "react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center min-h-dvh overflow-hidden",
        "bg-[radial-gradient(1200px_500px_at_20%_-20%,#0f766e1a,transparent),radial-gradient(900px_400px_at_90%_10%,#0369a11a,transparent),linear-gradient(180deg,#f6fffd_0%,#f8fafc_100%)]",
      )}
    >
      <main className="mx-auto flex w-full max-w-md flex-col items-center gap-8 px-6 py-16 text-center">
        <Logo variant="full-dark" size="lg" />

        <div className="flex flex-col items-center gap-3">
          <h1 className="text-2xl font-semibold text-slate-900">
            Something went wrong
          </h1>
          <p className="text-sm text-slate-500">
            An unexpected error occurred. You can try again or return to the
            home page.
          </p>
          {error.digest && (
            <p className="font-mono text-xs text-slate-400">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          <Button variant="primary" size="md" onClick={reset}>
            Try again
          </Button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 active:bg-neutral-100"
          >
            Go to home
          </Link>
        </div>
      </main>
    </div>
  );
}

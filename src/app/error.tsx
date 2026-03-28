"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

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
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger-100 text-danger-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
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

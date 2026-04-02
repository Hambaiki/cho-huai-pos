"use client";

import { Button } from "@/components/ui/Button";
import {
  FormError,
  FormField,
  FormInput,
  FormLabel,
} from "@/components/ui/form";
import { signInAction } from "@/features/auth/actions";
import { useSyncPendingAction } from "@/features/shell/pending/PendingActionProvider";
import { cn } from "@/lib/utils/cn";
import Link from "next/link";
import { useActionState } from "react";

export default function LoginPage() {
  const [state, action, isPending] = useActionState(signInAction, null);

  useSyncPendingAction(isPending, {
    message: "Signing in...",
    subMessage:
      "This may take a moment. Please do not close or refresh the page.",
  });

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center min-h-dvh overflow-hidden",
        "bg-[radial-gradient(1200px_500px_at_20%_-20%,#0f766e33,transparent),radial-gradient(900px_400px_at_90%_10%,#0369a133,transparent),linear-gradient(180deg,#f6fffd_0%,#f8fafc_100%)]",
      )}
    >
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-12">
        <h1 className="text-3xl font-semibold text-slate-900">Sign in</h1>
        <p className="mt-2 text-sm text-slate-600">
          Access your store dashboard and continue selling.
        </p>

        <form
          action={action}
          className="mt-8 space-y-4 rounded-2xl border border-slate-200 bg-white p-6"
        >
          <FormField>
            <FormLabel htmlFor="email">Email</FormLabel>
            <FormInput
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </FormField>

          <FormField>
            <FormLabel htmlFor="password">Password</FormLabel>
            <FormInput
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </FormField>

          <FormError message={!state?.ok ? state?.error : null} />

          <Button
            className="w-full"
            disabled={isPending}
            type="submit"
            isLoading={isPending}
          >
            Sign in
          </Button>
        </form>

        <p className="mt-4 text-sm text-slate-600">
          New here?{" "}
          <Link
            className="font-medium text-brand-700 hover:text-brand-800"
            href="/signup"
          >
            Create an owner account
          </Link>
        </p>
      </main>
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/Button";
import {
  FormError,
  FormField,
  FormInput,
  FormLabel,
  PasswordStrengthMeter,
} from "@/components/ui/form";
import { signUpAction } from "@/features/auth/actions";
import { useSyncPendingAction } from "@/features/shell/pending/PendingActionProvider";
import { cn } from "@/lib/utils/cn";
import Link from "next/link";
import { useActionState, useState } from "react";

export default function SignupPage() {
  const [state, action, isPending] = useActionState(signUpAction, null);
  const [password, setPassword] = useState("");

  useSyncPendingAction(isPending, {
    message: "Creating a new account...",
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
        <h1 className="text-3xl font-semibold text-neutral-900">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          Sign up to start setting up your store workspace.
        </p>

        <form
          action={action}
          className="mt-8 space-y-4 rounded-lg border border-border-200 bg-white p-6"
        >
          <FormField>
            <FormLabel htmlFor="displayName">Display name</FormLabel>
            <FormInput
              id="displayName"
              name="displayName"
              type="text"
              autoComplete="name"
              required
            />
          </FormField>

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
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <PasswordStrengthMeter password={password} />
          </FormField>

          <FormField>
            <FormLabel htmlFor="confirmPassword">Confirm password</FormLabel>
            <FormInput
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
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
            Create account
          </Button>
        </form>

        <p className="mt-4 text-sm text-neutral-600">
          Already have an account?{" "}
          <Link
            className="font-medium text-brand-600 hover:text-brand-700"
            href="/login"
          >
            Sign in
          </Link>
        </p>
      </main>
    </div>
  );
}

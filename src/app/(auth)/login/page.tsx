"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signInAction, type AuthActionState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";
import {
  FormField,
  FormLabel,
  FormInput,
  FormError,
} from "@/components/ui/form";

const initialState: AuthActionState = { error: null };

export default function LoginPage() {
  const [state, action, isPending] = useActionState(signInAction, initialState);

  return (
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

        <FormError message={state.error} />

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
  );
}

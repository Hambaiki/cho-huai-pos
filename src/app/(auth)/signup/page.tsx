"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUpAction, type AuthActionState } from "@/lib/actions/auth";

const initialState: AuthActionState = { error: null };

export default function SignupPage() {
  const [state, action, isPending] = useActionState(signUpAction, initialState);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
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
        <div className="space-y-1">
          <label
            className="text-sm font-medium text-neutral-700"
            htmlFor="displayName"
          >
            Display name
          </label>
          <input
            className="w-full rounded-md border border-border-200 px-3 py-2 text-sm outline-none ring-brand-200 transition focus:ring-2 bg-white"
            id="displayName"
            name="displayName"
            type="text"
            autoComplete="name"
            required
          />
        </div>

        <div className="space-y-1">
          <label
            className="text-sm font-medium text-neutral-700"
            htmlFor="email"
          >
            Email
          </label>
          <input
            className="w-full rounded-md border border-border-200 px-3 py-2 text-sm outline-none ring-brand-200 transition focus:ring-2 bg-white"
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </div>

        <div className="space-y-1">
          <label
            className="text-sm font-medium text-neutral-700"
            htmlFor="password"
          >
            Password
          </label>
          <input
            className="w-full rounded-md border border-border-200 px-3 py-2 text-sm outline-none ring-brand-200 transition focus:ring-2 bg-white"
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
          />
        </div>

        {state.error ? (
          <p className="rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-700">
            {state.error}
          </p>
        ) : null}

        <button
          className="w-full rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isPending}
          type="submit"
        >
          {isPending ? "Creating account..." : "Create account"}
        </button>
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
  );
}

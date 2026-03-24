"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signInAction, type AuthActionState } from "@/lib/actions/auth";

const initialState: AuthActionState = { error: null };

export default function LoginPage() {
  const [state, action, isPending] = useActionState(signInAction, initialState);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
      <h1 className="text-3xl font-semibold text-slate-900">Sign in</h1>
      <p className="mt-2 text-sm text-slate-600">
        Access your store dashboard and continue selling.
      </p>

      <form
        action={action}
        className="mt-8 space-y-4 rounded-2xl border border-slate-200 bg-white p-6"
      >
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700" htmlFor="email">
            Email
          </label>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-200 transition focus:ring-2"
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </div>

        <div className="space-y-1">
          <label
            className="text-sm font-medium text-slate-700"
            htmlFor="password"
          >
            Password
          </label>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-200 transition focus:ring-2"
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>

        {state.error ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {state.error}
          </p>
        ) : null}

        <button
          className="w-full rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isPending}
          type="submit"
        >
          {isPending ? "Signing in..." : "Sign in"}
        </button>
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

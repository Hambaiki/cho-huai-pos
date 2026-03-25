"use client";

import { useActionState } from "react";
import {
  signOutAction,
  updateAccountEmailAction,
  updateAccountPasswordAction,
  updateAccountProfileAction,
  type AuthActionState,
} from "@/lib/actions/auth";

interface AccountSettingsClientProps {
  email: string;
  displayName: string;
  createdAt: string;
}

const initialState: AuthActionState = { error: null };

export default function AccountSettingsClient({
  email,
  displayName,
  createdAt,
}: AccountSettingsClientProps) {
  const [profileState, profileAction, isProfilePending] = useActionState(
    updateAccountProfileAction,
    initialState,
  );
  const [emailState, emailAction, isEmailPending] = useActionState(
    updateAccountEmailAction,
    initialState,
  );
  const [passwordState, passwordAction, isPasswordPending] = useActionState(
    updateAccountPasswordAction,
    initialState,
  );

  return (
    <section className="mx-auto space-y-6">
      <form
        action={profileAction}
        className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5"
      >
        <div>
          <label
            htmlFor="displayName"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Display name
          </label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            defaultValue={displayName}
            required
            maxLength={80}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-brand-200 transition focus:ring-2"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Email
            </p>
            <p className="mt-1 text-sm text-slate-700">{email}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Member since
            </p>
            <p className="mt-1 text-sm text-slate-700">{createdAt}</p>
          </div>
        </div>

        {profileState.error ? (
          <p className="rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-700">
            {profileState.error}
          </p>
        ) : null}

        {profileState.success ? (
          <p className="rounded-md bg-success-50 px-3 py-2 text-sm text-success-700">
            {profileState.success}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={isProfilePending}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isProfilePending ? "Saving..." : "Save profile"}
          </button>
        </div>
      </form>

      <form
        action={emailAction}
        className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5"
      >
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Email</h2>
          <p className="mt-1 text-sm text-slate-600">
            Update your login email address.
          </p>
        </div>

        <div>
          <label
            htmlFor="email"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            New email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={email}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-brand-200 transition focus:ring-2"
          />
        </div>

        {emailState.error ? (
          <p className="rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-700">
            {emailState.error}
          </p>
        ) : null}

        {emailState.success ? (
          <p className="rounded-md bg-success-50 px-3 py-2 text-sm text-success-700">
            {emailState.success}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isEmailPending}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isEmailPending ? "Saving..." : "Update email"}
        </button>
      </form>

      <form
        action={passwordAction}
        className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5"
      >
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Password</h2>
          <p className="mt-1 text-sm text-slate-600">
            Set a new password for your account.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              New password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              minLength={8}
              required
              autoComplete="new-password"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-brand-200 transition focus:ring-2"
            />
          </div>
          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Confirm password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              minLength={8}
              required
              autoComplete="new-password"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-brand-200 transition focus:ring-2"
            />
          </div>
        </div>

        {passwordState.error ? (
          <p className="rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-700">
            {passwordState.error}
          </p>
        ) : null}

        {passwordState.success ? (
          <p className="rounded-md bg-success-50 px-3 py-2 text-sm text-success-700">
            {passwordState.success}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isPasswordPending}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPasswordPending ? "Saving..." : "Update password"}
        </button>
      </form>

      <form action={signOutAction}>
        <button
          type="submit"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Sign out
        </button>
      </form>
    </section>
  );
}

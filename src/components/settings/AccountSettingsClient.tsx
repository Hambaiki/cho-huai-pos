"use client";

import { useActionState } from "react";
import {
  signOutAction,
  updateAccountEmailAction,
  updateAccountPasswordAction,
  updateAccountProfileAction,
  type AuthActionState,
} from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";
import {
  FormField,
  FormLabel,
  FormInput,
  FormError,
} from "@/components/ui/form";

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
        <FormField>
          <FormLabel htmlFor="displayName" required>Display name</FormLabel>
          <FormInput
            id="displayName"
            name="displayName"
            type="text"
            defaultValue={displayName}
            required
            maxLength={80}
          />
        </FormField>

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

        <FormError message={profileState.error} />
        {profileState.success ? (
          <p className="rounded-md bg-success-50 px-3 py-2 text-sm text-success-700">
            {profileState.success}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button
            type="submit"
            isLoading={isProfilePending}
          >
            {isProfilePending ? "Saving..." : "Save profile"}
          </Button>
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

        <FormField>
          <FormLabel htmlFor="email" required>New email</FormLabel>
          <FormInput
            id="email"
            name="email"
            type="email"
            defaultValue={email}
            required
          />
        </FormField>

        <FormError message={emailState.error} />

        {emailState.success ? (
          <p className="rounded-md bg-success-50 px-3 py-2 text-sm text-success-700">
            {emailState.success}
          </p>
        ) : null}

        <Button
          type="submit"
          isLoading={isEmailPending}
        >
          {isEmailPending ? "Saving..." : "Update email"}
        </Button>
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
          <FormField>
            <FormLabel htmlFor="password" required>New password</FormLabel>
            <FormInput
              id="password"
              name="password"
              type="password"
              minLength={8}
              required
              autoComplete="new-password"
            />
          </FormField>
          <FormField>
            <FormLabel htmlFor="confirmPassword" required>Confirm password</FormLabel>
            <FormInput
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              minLength={8}
              required
              autoComplete="new-password"
            />
          </FormField>
        </div>

        <FormError message={passwordState.error} />

        {passwordState.success ? (
          <p className="rounded-md bg-success-50 px-3 py-2 text-sm text-success-700">
            {passwordState.success}
          </p>
        ) : null}

        <Button
          type="submit"
          isLoading={isPasswordPending}
        >
          {isPasswordPending ? "Saving..." : "Update password"}
        </Button>
      </form>

      <form action={signOutAction}>
        <Button
          type="submit"
          variant="outline"
        >
          Sign out
        </Button>
      </form>
    </section>
  );
}

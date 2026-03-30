"use client";

import { useActionState, useState } from "react";
import {
  deleteAccountAction,
  signOutAction,
  updateAccountEmailAction,
  updateAccountPasswordAction,
  updateAccountProfileAction,
  type AuthActionState,
} from "@/lib/actions/auth";
import { PWA_INSTALL_DISMISS_KEY } from "@/lib/utils/pwa";
import { Button } from "@/components/ui/Button";
import {
  FormField,
  FormLabel,
  FormInput,
  FormCheckbox,
  FormError,
  FormSuccess,
  FormToggle,
} from "@/components/ui/form";
import {
  SectionCard,
  SectionCardBody,
  SectionCardFooter,
  SectionCardHeader,
} from "@/components/ui/SectionCard";

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
  const [resetInstallPromptToggle, setResetInstallPromptToggle] =
    useState(false);
  const [qaFeedback, setQaFeedback] = useState<string | null>(null);

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
  const [deleteState, deleteAction, isDeletePending] = useActionState(
    deleteAccountAction,
    initialState,
  );

  const handleResetInstallPromptDismissal = (nextValue: boolean) => {
    setResetInstallPromptToggle(nextValue);

    if (!nextValue) {
      return;
    }

    window.localStorage.removeItem(PWA_INSTALL_DISMISS_KEY);
    setQaFeedback(
      "Install prompt dismissal reset for this browser. Reload and trigger install criteria to test again.",
    );

    window.setTimeout(() => {
      setResetInstallPromptToggle(false);
    }, 500);
  };

  return (
    <section className="mx-auto space-y-6">
      <SectionCard>
        <SectionCardHeader
          title="Profile"
          description="Update your display name and view account details."
        />
        <form action={profileAction}>
          <SectionCardBody className="space-y-5">
            <FormField>
              <FormLabel htmlFor="displayName" required>
                Display name
              </FormLabel>
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
            <FormSuccess message={profileState.success} />
          </SectionCardBody>

          <SectionCardFooter>
            <Button type="submit" isLoading={isProfilePending}>
              {isProfilePending ? "Saving..." : "Save profile"}
            </Button>
          </SectionCardFooter>
        </form>
      </SectionCard>

      <SectionCard>
        <SectionCardHeader
          title="Email"
          description="Update your login email address."
        />

        <form action={emailAction}>
          <SectionCardBody className="space-y-5">
            <FormField>
              <FormLabel htmlFor="email" required>
                New email
              </FormLabel>
              <FormInput
                id="email"
                name="email"
                type="email"
                defaultValue={email}
                required
              />
            </FormField>

            <FormError message={emailState.error} />
            <FormSuccess message={emailState.success} />
          </SectionCardBody>

          <SectionCardFooter>
            <Button type="submit" isLoading={isEmailPending}>
              {isEmailPending ? "Saving..." : "Update email"}
            </Button>
          </SectionCardFooter>
        </form>
      </SectionCard>

      <SectionCard>
        <SectionCardHeader
          title="Password"
          description="Set a new password for your account."
        />
        <form action={passwordAction} className="space-y-5">
          <SectionCardBody className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField>
                <FormLabel htmlFor="password" required>
                  New password
                </FormLabel>
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
                <FormLabel htmlFor="confirmPassword" required>
                  Confirm password
                </FormLabel>
                <FormInput
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  minLength={8}
                  required
                  autoComplete="new-password"
                />
              </FormField>

              <FormError message={passwordState.error} />
              <FormSuccess message={passwordState.success} />
            </div>
          </SectionCardBody>
          <SectionCardFooter>
            <Button type="submit" isLoading={isPasswordPending}>
              {isPasswordPending ? "Saving..." : "Update password"}
            </Button>
          </SectionCardFooter>
        </form>
      </SectionCard>

      <SectionCard>
        <SectionCardHeader
          title={<span className="text-danger-600">Danger zone</span>}
          description={
            <span className="text-danger-500">
              Delete your account permanently. This action cannot be undone.
            </span>
          }
        />
        <form action={deleteAction}>
          <SectionCardBody className="space-y-4">
            <p className="text-sm">
              Your account access will be removed immediately. Type DELETE and
              confirm to continue.
            </p>

            <FormField>
              <FormLabel
                htmlFor="deleteConfirmation"
                required
                className="text-danger-600"
              >
                Type DELETE to confirm
              </FormLabel>
              <FormInput
                id="deleteConfirmation"
                name="deleteConfirmation"
                type="text"
                placeholder="DELETE"
                required
                className="border-danger-200 bg-danger-50 text-danger-950 placeholder:text-danger-400"
              />
            </FormField>

            <FormCheckbox
              id="deleteAcknowledge"
              name="deleteAcknowledge"
              required
              label={
                <span className="text-sm font-medium">
                  I understand this permanently deletes my account.
                </span>
              }
            />

            <FormError message={deleteState.error} />
          </SectionCardBody>
          <SectionCardFooter>
            <Button
              type="submit"
              variant="destructive"
              isLoading={isDeletePending}
            >
              {isDeletePending ? "Deleting..." : "Delete account"}
            </Button>
          </SectionCardFooter>
        </form>
      </SectionCard>

      <SectionCard>
        <SectionCardHeader
          title="QA tools"
          description="Helpers for local install prompt testing on this device/browser."
        />
        <SectionCardBody className="space-y-3">
          <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 p-3">
            <div>
              <p className="text-sm font-medium text-slate-900">
                Reset PWA install prompt dismissal
              </p>
              <p className="text-xs text-slate-600">
                Clears the 7-day cooldown set when dismissing the install
                banner.
              </p>
            </div>

            <FormToggle
              aria-label="Reset PWA install prompt dismissal"
              onChange={handleResetInstallPromptDismissal}
              value={resetInstallPromptToggle}
            />
          </div>

          <FormSuccess message={qaFeedback} />
        </SectionCardBody>
      </SectionCard>

      <form action={signOutAction}>
        <Button type="submit" variant="outline">
          Sign out
        </Button>
      </form>
    </section>
  );
}

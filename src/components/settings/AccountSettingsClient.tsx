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
  FormSuccess,
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

      <SectionCard className="bg-danger-500">
        <SectionCardHeader
          title={<span className="text-white">Danger zone</span>}
          description={
            <span className="text-danger-50">Delete your account.</span>
          }
        />
      </SectionCard>

      <form action={signOutAction}>
        <Button type="submit" variant="outline">
          Sign out
        </Button>
      </form>
    </section>
  );
}

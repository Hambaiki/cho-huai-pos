"use server";

import {
  deleteAccountSchema,
  signInSchema,
  signUpSchema,
  updateAccountSchema,
  updateEmailSchema,
  updatePasswordSchema,
} from "@/features/auth/validations";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getSignUpEmailOptions } from "@/lib/utils/signup-email";
import { Result } from "@/types/action";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function signInAction(
  _prevState: Result | null,
  formData: FormData,
): Promise<Result> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { ok: false, error: "Please enter a valid email and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { ok: false, error: error.message };
  }

  redirect("/dashboard");
}

export async function signUpAction(
  _prevState: Result | null,
  formData: FormData,
): Promise<Result> {
  const parsed = signUpSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "Please complete all required fields correctly.",
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: getSignUpEmailOptions(parsed.data.displayName),
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  if (!data.user) {
    return { ok: false, error: "Account creation failed. Please try again." };
  }

  redirect("/dashboard");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function updateAccountProfileAction(
  _prevState: Result | null,
  formData: FormData,
): Promise<Result> {
  const parsed = updateAccountSchema.safeParse({
    displayName: formData.get("displayName"),
  });

  if (!parsed.success) {
    return { ok: false, error: "Please provide a valid display name." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Authentication required." };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ display_name: parsed.data.displayName })
    .eq("id", user.id);

  if (profileError) {
    return { ok: false, error: profileError.message };
  }

  const { error: authError } = await supabase.auth.updateUser({
    data: { display_name: parsed.data.displayName },
  });

  if (authError) {
    return { ok: false, error: authError.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/account");
  return { ok: true, message: "Profile updated." };
}

export async function updateAccountEmailAction(
  _prevState: Result | null,
  formData: FormData,
): Promise<Result> {
  const parsed = updateEmailSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Authentication required." };
  }

  const nextEmail = parsed.data.email;
  if ((user.email ?? "").toLowerCase() === nextEmail.toLowerCase()) {
    return { ok: true, message: "Email is already up to date." };
  }

  const { error } = await supabase.auth.updateUser({ email: nextEmail });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard/account");
  return {
    ok: true,
    message:
      "Email update requested. Please check your inbox to confirm the new email.",
  };
}

export async function updateAccountPasswordAction(
  _prevState: Result | null,
  formData: FormData,
): Promise<Result> {
  const parsed = updatePasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ?? "Please provide a valid password.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Authentication required." };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, message: "Password updated." };
}

export async function deleteAccountAction(
  _prevState: Result | null,
  formData: FormData,
): Promise<Result> {
  const parsed = deleteAccountSchema.safeParse({
    deleteConfirmation: formData.get("deleteConfirmation"),
    deleteAcknowledge: formData.get("deleteAcknowledge"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "Please complete the delete confirmation fields.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Authentication required." };
  }

  const { count: ownedStoreCount, error: ownedStoreError } = await supabase
    .from("stores")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id);

  if (ownedStoreError) {
    return { ok: false, error: ownedStoreError.message };
  }

  if ((ownedStoreCount ?? 0) > 0) {
    return {
      ok: false,
      error: "Transfer or delete stores you own before deleting your account.",
    };
  }

  let adminClient: ReturnType<typeof createAdminClient>;

  try {
    adminClient = createAdminClient();
  } catch {
    return {
      ok: false,
      error: "Account deletion is not configured on this environment.",
    };
  }

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(
    user.id,
  );

  if (deleteError) {
    return { ok: false, error: deleteError.message };
  }

  await supabase.auth.signOut();
  redirect("/login");
}

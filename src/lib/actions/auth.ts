"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

import { getSignUpEmailOptions } from "@/lib/utils/signup-email";

const signInSchema = z.object({
  email: z.email().trim(),
  password: z.string().min(8),
});

const signUpSchema = z.object({
  displayName: z.string().min(2).max(80).trim(),
  email: z.email().trim(),
  password: z.string().min(8),
});

const updateAccountSchema = z.object({
  displayName: z.string().min(2).max(80).trim(),
});

export interface AuthActionState {
  error: string | null;
  success?: string | null;
}

export async function signInAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Please enter a valid email and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function signUpAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signUpSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Please complete all required fields correctly." };
  }

  const supabase = await createClient();

  // Create account
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: getSignUpEmailOptions(parsed.data.displayName),
  });

  if (error) {
    return { error: error.message };
  }

  if (!data.user) {
    return { error: "Account creation failed. Please try again." };
  }

  redirect("/dashboard");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function updateAccountProfileAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = updateAccountSchema.safeParse({
    displayName: formData.get("displayName"),
  });

  if (!parsed.success) {
    return { error: "Please provide a valid display name.", success: null };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required.", success: null };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ display_name: parsed.data.displayName })
    .eq("id", user.id);

  if (profileError) {
    return { error: profileError.message, success: null };
  }

  const { error: authError } = await supabase.auth.updateUser({
    data: { display_name: parsed.data.displayName },
  });

  if (authError) {
    return { error: authError.message, success: null };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/account");
  return { error: null, success: "Profile updated." };
}

const updateEmailSchema = z.object({
  email: z.email().trim(),
});

export async function updateAccountEmailAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = updateEmailSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: "Please enter a valid email address.", success: null };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required.", success: null };
  }

  const nextEmail = parsed.data.email;
  if ((user.email ?? "").toLowerCase() === nextEmail.toLowerCase()) {
    return { error: null, success: "Email is already up to date." };
  }

  const { error } = await supabase.auth.updateUser({ email: nextEmail });

  if (error) {
    return { error: error.message, success: null };
  }

  revalidatePath("/dashboard/account");
  return {
    error: null,
    success:
      "Email update requested. Please check your inbox to confirm the new email.",
  };
}

const updatePasswordSchema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

const deleteAccountSchema = z
  .object({
    deleteConfirmation: z.string().trim(),
    deleteAcknowledge: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.deleteConfirmation.toUpperCase() !== "DELETE") {
      ctx.addIssue({
        code: "custom",
        path: ["deleteConfirmation"],
        message: 'Type "DELETE" to confirm account deletion.',
      });
    }

    if (data.deleteAcknowledge !== "on") {
      ctx.addIssue({
        code: "custom",
        path: ["deleteAcknowledge"],
        message: "Please acknowledge this action before continuing.",
      });
    }
  });

export async function updateAccountPasswordAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = updatePasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ?? "Please provide a valid password.",
      success: null,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required.", success: null };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { error: error.message, success: null };
  }

  return { error: null, success: "Password updated." };
}

export async function deleteAccountAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = deleteAccountSchema.safeParse({
    deleteConfirmation: formData.get("deleteConfirmation"),
    deleteAcknowledge: formData.get("deleteAcknowledge"),
  });

  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ??
        "Please complete the delete confirmation fields.",
      success: null,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required.", success: null };
  }

  const { count: ownedStoreCount, error: ownedStoreError } = await supabase
    .from("stores")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id);

  if (ownedStoreError) {
    return { error: ownedStoreError.message, success: null };
  }

  if ((ownedStoreCount ?? 0) > 0) {
    return {
      error: "Transfer or delete stores you own before deleting your account.",
      success: null,
    };
  }

  let adminClient: ReturnType<typeof createAdminClient>;

  try {
    adminClient = createAdminClient();
  } catch {
    return {
      error: "Account deletion is not configured on this environment.",
      success: null,
    };
  }

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);

  if (deleteError) {
    return { error: deleteError.message, success: null };
  }

  await supabase.auth.signOut();
  redirect("/login");
}

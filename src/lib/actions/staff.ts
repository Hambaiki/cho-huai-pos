"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSignUpEmailOptions } from "@/lib/utils/signup-email";

const inviteStaffSchema = z.object({
  storeId: z.string().uuid(),
  role: z.enum(["manager", "cashier", "viewer"]), // Exclude 'owner' role
  expiresInDays: z.number().int().min(1).max(365).optional().default(7),
  note: z.string().max(255).optional(),
});

const acceptStaffInviteSchema = z.object({
  displayName: z.string().min(2).max(80).trim(),
  email: z.string().email().trim(),
  password: z.string().min(8),
  inviteCode: z.string().min(1).trim().toUpperCase(),
});

export interface StaffActionState {
  error: string | null;
  data?: {
    code?: string;
    message?: string;
    redirectPath?: string;
  };
}

export async function inviteStaffAction(
  _prevState: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  const parsed = inviteStaffSchema.safeParse({
    storeId: formData.get("storeId"),
    role: formData.get("role"),
    expiresInDays: formData.get("expiresInDays")
      ? parseInt(formData.get("expiresInDays") as string)
      : undefined,
    note: formData.get("note"),
  });

  if (!parsed.success) {
    return { error: "Invalid invite parameters." };
  }

  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required." };
  }

  // Verify user is store owner
  const { data: userRole, error: roleError } = await supabase
    .from("store_members")
    .select("role")
    .eq("store_id", parsed.data.storeId)
    .eq("user_id", user.id)
    .single();

  if (roleError || !userRole) {
    return { error: "You do not have access to this store." };
  }

  if (userRole.role !== "owner" && userRole.role !== "manager") {
    return {
      error: "Only store owners or managers can invite staff.",
    };
  }

  // Generate random 6-character code (uppercase alphanumeric)
  const code = Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase()
    .padStart(6, "0");

  // Calculate expiration date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + parsed.data.expiresInDays);

  // Create staff invite code
  const { data: inviteRecord, error: createError } = await supabase
    .from("invite_codes")
    .insert({
      code,
      store_id: parsed.data.storeId,
      role: parsed.data.role,
      created_by: user.id,
      max_uses: 1,
      used_count: 0,
      expires_at: expiresAt.toISOString(),
      is_revoked: false,
      note: parsed.data.note,
    })
    .select("id")
    .single();

  if (createError || !inviteRecord) {
    return { error: "Failed to create invite code. Please try again." };
  }

  return {
    error: null,
    data: {
      code,
      message: `Staff invite code created: ${code}. Valid for ${parsed.data.expiresInDays} days.`,
    },
  };
}

export async function acceptStaffInviteAction(
  _prevState: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  const parsed = acceptStaffInviteSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
    inviteCode: formData.get("inviteCode"),
  });

  if (!parsed.success) {
    return { error: "Please complete all required fields correctly." };
  }

  const supabase = await createClient();

  // Validate invite code
  const { data: inviteRecord, error: inviteError } = await supabase
    .from("invite_codes")
    .select("id, is_revoked, expires_at, max_uses, used_count, store_id, role, created_by")
    .eq("code", parsed.data.inviteCode)
    .single();

  if (inviteError || !inviteRecord) {
    return { error: "Invalid invite code. Please check and try again." };
  }

  // Check if revoked
  if (inviteRecord.is_revoked) {
    return { error: "This invite code has been revoked." };
  }

  // Check if expired
  if (
    inviteRecord.expires_at &&
    new Date(inviteRecord.expires_at) < new Date()
  ) {
    return { error: "This invite code has expired." };
  }

  // Check if max uses reached
  if (inviteRecord.used_count >= inviteRecord.max_uses) {
    return { error: "This invite code has reached its usage limit." };
  }

  // Determine if this is a staff invite or account owner invite
  const isStaffInvite = inviteRecord.store_id && inviteRecord.role;

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

  // If staff invite, add user to store_members immediately
  if (isStaffInvite && inviteRecord.store_id && inviteRecord.role) {
    const { error: memberError } = await supabase
      .from("store_members")
      .insert({
        store_id: inviteRecord.store_id,
        user_id: data.user.id,
        role: inviteRecord.role,
        invited_by: inviteRecord.created_by || data.user.id,
      });

    if (memberError) {
      console.error("Warning: Failed to add user to store:", memberError);
      // Don't fail signup, continue
    }
  }

  // Increment invite code usage count atomically
  const { error: updateError } = await supabase
    .from("invite_codes")
    .update({ used_count: inviteRecord.used_count + 1 })
    .eq("id", inviteRecord.id);

  if (updateError) {
    console.error("Warning: Failed to increment invite code usage:", updateError);
    // Don't fail signup if increment fails, just log it
  }

  // Redirect based on invite type
  const redirectPath = "/dashboard";
  return {
    error: null,
    data: {
      message: `Welcome! Redirecting...`,
      redirectPath: redirectPath as string,
    },
  };
}

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

type AdminActionResult = {
  ok: boolean;
  error?: string;
};

const setUserSuspensionSchema = z.object({
  userId: z.uuid(),
  suspend: z
    .string()
    .transform((value) => value === "true")
    .pipe(z.boolean()),
});

const setUserSuperAdminSchema = z.object({
  userId: z.uuid(),
  makeSuperAdmin: z
    .string()
    .transform((value) => value === "true")
    .pipe(z.boolean()),
});

const setStoreSuspensionSchema = z.object({
  storeId: z.uuid(),
  suspend: z
    .string()
    .transform((value) => value === "true")
    .pipe(z.boolean()),
});

const setStoreStaffLimitOverrideSchema = z.object({
  storeId: z.uuid(),
  staffLimitOverride: z
    .string()
    .trim()
    .transform((value) => (value.length === 0 ? null : Number(value)))
    .refine(
      (value) =>
        value === null ||
        (Number.isInteger(value) && Number.isFinite(value) && value > 0),
      {
        message: "Staff limit must be a positive integer.",
      },
    )
    .nullable(),
});

const setUserStoreLimitOverrideSchema = z.object({
  userId: z.uuid(),
  storeLimitOverride: z
    .string()
    .trim()
    .transform((value) => (value.length === 0 ? null : Number(value)))
    .refine(
      (value) =>
        value === null ||
        (Number.isInteger(value) && Number.isFinite(value) && value > 0),
      {
        message: "Store limit must be a positive integer.",
      },
    )
    .nullable(),
});

async function requireSuperAdminActor() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, actorId: null, error: "Not authenticated." };
  }

  const { data: actorProfile } = await supabase
    .from("profiles")
    .select("is_super_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!actorProfile?.is_super_admin) {
    return { supabase, actorId: user.id, error: "Forbidden." };
  }

  return { supabase, actorId: user.id, error: null as string | null };
}

export async function setUserSuspensionAction(
  formData: FormData,
): Promise<AdminActionResult> {
  const parsed = setUserSuspensionSchema.safeParse({
    userId: formData.get("userId"),
    suspend: formData.get("suspend"),
  });

  if (!parsed.success) {
    return { ok: false, error: "Invalid request." };
  }

  const { supabase, actorId, error } = await requireSuperAdminActor();

  if (error || !actorId) {
    return { ok: false, error: error ?? "Forbidden." };
  }

  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("is_super_admin")
    .eq("id", parsed.data.userId)
    .maybeSingle();

  if (!targetProfile) {
    return { ok: false, error: "User not found." };
  }

  if (parsed.data.suspend && parsed.data.userId === actorId) {
    return { ok: false, error: "You cannot suspend your own account." };
  }

  if (parsed.data.suspend && targetProfile.is_super_admin) {
    return { ok: false, error: "Super admin accounts cannot be suspended." };
  }

  await supabase
    .from("profiles")
    .update({ is_suspended: parsed.data.suspend })
    .eq("id", parsed.data.userId);

  revalidatePath("/admin/users");
  return { ok: true };
}

export async function setUserSuperAdminAction(
  formData: FormData,
): Promise<AdminActionResult> {
  const parsed = setUserSuperAdminSchema.safeParse({
    userId: formData.get("userId"),
    makeSuperAdmin: formData.get("makeSuperAdmin"),
  });

  if (!parsed.success) {
    return { ok: false, error: "Invalid request." };
  }

  const { supabase, actorId, error } = await requireSuperAdminActor();

  if (error || !actorId) {
    return { ok: false, error: error ?? "Forbidden." };
  }

  if (!parsed.data.makeSuperAdmin && parsed.data.userId === actorId) {
    return {
      ok: false,
      error: "You cannot remove your own super admin access.",
    };
  }

  if (!parsed.data.makeSuperAdmin) {
    const { count: superAdminCount } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_super_admin", true);

    if ((superAdminCount ?? 0) <= 1) {
      return {
        ok: false,
        error: "At least one super admin must remain.",
      };
    }
  }

  const updates: { is_super_admin: boolean; is_suspended?: boolean } = {
    is_super_admin: parsed.data.makeSuperAdmin,
  };

  if (parsed.data.makeSuperAdmin) {
    updates.is_suspended = false;
  }

  await supabase.from("profiles").update(updates).eq("id", parsed.data.userId);

  revalidatePath("/admin/users");
  return { ok: true };
}

export async function setStoreSuspensionAction(
  formData: FormData,
): Promise<AdminActionResult> {
  const parsed = setStoreSuspensionSchema.safeParse({
    storeId: formData.get("storeId"),
    suspend: formData.get("suspend"),
  });

  if (!parsed.success) {
    return { ok: false, error: "Invalid request." };
  }

  const { supabase, error } = await requireSuperAdminActor();

  if (error) {
    return { ok: false, error };
  }

  await supabase
    .from("stores")
    .update({ is_suspended: parsed.data.suspend })
    .eq("id", parsed.data.storeId);

  revalidatePath("/admin/stores");
  revalidatePath("/dashboard/stores");
  revalidatePath(`/dashboard/store/${parsed.data.storeId}`);

  return { ok: true };
}

export async function setStoreStaffLimitOverrideAction(
  formData: FormData,
): Promise<AdminActionResult> {
  const parsed = setStoreStaffLimitOverrideSchema.safeParse({
    storeId: formData.get("storeId"),
    staffLimitOverride: formData.get("staffLimitOverride") ?? "",
  });

  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "Invalid staff limit override value.",
    };
  }

  const { supabase, error } = await requireSuperAdminActor();

  if (error) {
    return { ok: false, error };
  }

  const { error: updateError } = await supabase
    .from("stores")
    .update({ staff_limit_override: parsed.data.staffLimitOverride })
    .eq("id", parsed.data.storeId);

  if (updateError) {
    return { ok: false, error: "Unable to update staff limit override." };
  }

  revalidatePath("/admin/stores");
  revalidatePath(`/dashboard/store/${parsed.data.storeId}/settings`);

  return { ok: true };
}

export async function setUserStoreLimitOverrideAction(
  formData: FormData,
): Promise<AdminActionResult> {
  const parsed = setUserStoreLimitOverrideSchema.safeParse({
    userId: formData.get("userId"),
    storeLimitOverride: formData.get("storeLimitOverride") ?? "",
  });

  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "Invalid store limit override value.",
    };
  }

  const { supabase, error } = await requireSuperAdminActor();

  if (error) {
    return { ok: false, error };
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ store_limit_override: parsed.data.storeLimitOverride })
    .eq("id", parsed.data.userId);

  if (updateError) {
    return { ok: false, error: "Unable to update store limit override." };
  }

  revalidatePath("/admin/users");
  revalidatePath("/dashboard/stores");

  return { ok: true };
}

// ─── Sitewide Settings ────────────────────────────────────────────────────────

const updateSitewideSettingsSchema = z.object({
  maintenanceMode: z
    .string()
    .transform((value) => value === "true")
    .pipe(z.boolean()),
  announcementText: z.string().max(1000).trim(),
});

export async function updateSitewideSettingsAction(
  formData: FormData,
): Promise<AdminActionResult> {
  const parsed = updateSitewideSettingsSchema.safeParse({
    maintenanceMode: formData.get("maintenanceMode"),
    announcementText: formData.get("announcementText") ?? "",
  });

  if (!parsed.success) {
    return { ok: false, error: "Invalid request." };
  }

  const { supabase, error } = await requireSuperAdminActor();

  if (error) {
    return { ok: false, error };
  }

  const updates = [
    {
      key: "maintenance_mode",
      value: String(parsed.data.maintenanceMode),
    },
    {
      key: "announcement_text",
      value: parsed.data.announcementText,
    },
  ];

  for (const update of updates) {
    await supabase
      .from("site_settings")
      .update({ value: update.value, updated_at: new Date().toISOString() })
      .eq("key", update.key);
  }

  revalidatePath("/admin/settings");
  revalidatePath("/admin");
  return { ok: true };
}

export async function getSitewideSettings() {
  const supabase = await createClient();

  const { data: settings } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", ["maintenance_mode", "announcement_text"]);

  const settingsMap = new Map((settings ?? []).map((s) => [s.key, s.value]));

  return {
    maintenanceMode: settingsMap.get("maintenance_mode") === "true",
    announcementText: settingsMap.get("announcement_text") ?? "",
  };
}

/**
 * Fetch current user's profile with full type safety.
 *
 * @throws Will redirect to login if user is not authenticated
 * @returns Typed profile data with id, email, and admin status
 */
export async function getCurrentUserProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, is_super_admin")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    throw new Error("Profile not found");
  }

  return { user, profile };
}

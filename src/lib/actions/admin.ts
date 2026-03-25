"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

type AdminActionResult = {
  ok: boolean;
  error?: string;
};

const setUserSuspensionSchema = z.object({
  userId: z.string().uuid(),
  suspend: z
    .string()
    .transform((value) => value === "true")
    .pipe(z.boolean()),
});

const setUserSuperAdminSchema = z.object({
  userId: z.string().uuid(),
  makeSuperAdmin: z
    .string()
    .transform((value) => value === "true")
    .pipe(z.boolean()),
});

const setStoreSuspensionSchema = z.object({
  storeId: z.string().uuid(),
  suspend: z
    .string()
    .transform((value) => value === "true")
    .pipe(z.boolean()),
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

  await supabase
    .from("profiles")
    .update(updates)
    .eq("id", parsed.data.userId);

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

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createTypedServerClient } from "@/lib/supabase/typed-client";

export interface StaffMember {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  role: "owner" | "manager" | "cashier" | "viewer";
  joinedAt: string;
}

export interface QrChannelRow {
  id: string;
  label: string;
  image_url: string;
  is_enabled: boolean;
  sort_order: number;
}

export interface CategoryRow {
  id: string;
  name: string;
  sort_order: number;
}

export type SettingsActionResult<T = null> =
  | { data: T; error: null }
  | { data: null; error: string };

const categorySchema = z.object({
  storeId: z.uuid(),
  categoryId: z.uuid().optional(),
  name: z.string().min(1).max(80).trim(),
  sortOrder: z.number().int().min(0).max(9999),
});

async function requireStoreManager(
  storeId: string,
): Promise<SettingsActionResult<{ userId: string }>> {
  const supabase = await createTypedServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { data: null, error: "Authentication required." };

  const { data: membership } = await supabase
    .from("store_members")
    .select("role")
    .eq("store_id", storeId)
    .eq("user_id", user.id)
    .single();

  if (!membership || !["owner", "manager"].includes(membership.role)) {
    return { data: null, error: "Only owners or managers can manage categories." };
  }

  return { data: { userId: user.id }, error: null };
}

// ─── Staff ────────────────────────────────────────────────────────────────────

export async function getStaffMembers(storeId: string): Promise<StaffMember[]> {
  const supabase = await createTypedServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("store_members")
    .select("id, role, joined_at, user_id")
    .eq("store_id", storeId)
    .order("joined_at", { ascending: false });

  if (error || !data) return [];

  const userIds = data.map((m) => m.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", userIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));

  return data.map((member) => ({
    id: member.id,
    userId: member.user_id,
    displayName: profileMap.get(member.user_id) ?? "Unknown",
    email: "",
    role: member.role as StaffMember["role"],
    joinedAt: member.joined_at,
  }));
}

export async function getStoreCategories(
  storeId: string,
): Promise<CategoryRow[]> {
  const supabase = await createTypedServerClient();

  const { data } = await supabase
    .from("categories")
    .select("id, name, sort_order")
    .eq("store_id", storeId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })
    .returns<CategoryRow[]>();

  return data ?? [];
}

export async function createCategoryAction(
  _prevState: SettingsActionResult,
  formData: FormData,
): Promise<SettingsActionResult> {
  const parsed = categorySchema.safeParse({
    storeId: formData.get("storeId"),
    name: formData.get("name"),
    sortOrder: Number.parseInt((formData.get("sortOrder") as string) || "", 10) || 0,
  });

  if (!parsed.success) {
    return { data: null, error: "Invalid category input." };
  }

  const guard = await requireStoreManager(parsed.data.storeId);
  if (guard.error) return guard;

  const supabase = await createTypedServerClient();

  const { data: existing } = await supabase
    .from("categories")
    .select("id")
    .eq("store_id", parsed.data.storeId)
    .ilike("name", parsed.data.name)
    .maybeSingle();

  if (existing) {
    return { data: null, error: "A category with this name already exists." };
  }

  const { error } = await supabase.from("categories").insert({
    store_id: parsed.data.storeId,
    name: parsed.data.name,
    sort_order: parsed.data.sortOrder,
  });

  if (error) return { data: null, error: error.message };

  revalidatePath(`/dashboard/store/${parsed.data.storeId}/settings`);
  revalidatePath(`/dashboard/store/${parsed.data.storeId}/inventory`);
  return { data: null, error: null };
}

export async function updateCategoryAction(
  _prevState: SettingsActionResult,
  formData: FormData,
): Promise<SettingsActionResult> {
  const parsed = categorySchema.safeParse({
    storeId: formData.get("storeId"),
    categoryId: formData.get("categoryId"),
    name: formData.get("name"),
    sortOrder: Number.parseInt((formData.get("sortOrder") as string) || "", 10) || 0,
  });

  if (!parsed.success || !parsed.data.categoryId) {
    return { data: null, error: "Invalid category update input." };
  }

  const guard = await requireStoreManager(parsed.data.storeId);
  if (guard.error) return guard;

  const supabase = await createTypedServerClient();

  const { data: duplicate } = await supabase
    .from("categories")
    .select("id")
    .eq("store_id", parsed.data.storeId)
    .ilike("name", parsed.data.name)
    .neq("id", parsed.data.categoryId)
    .maybeSingle();

  if (duplicate) {
    return { data: null, error: "A category with this name already exists." };
  }

  const { error } = await supabase
    .from("categories")
    .update({
      name: parsed.data.name,
      sort_order: parsed.data.sortOrder,
    })
    .eq("id", parsed.data.categoryId)
    .eq("store_id", parsed.data.storeId);

  if (error) return { data: null, error: error.message };

  revalidatePath(`/dashboard/store/${parsed.data.storeId}/settings`);
  revalidatePath(`/dashboard/store/${parsed.data.storeId}/inventory`);
  return { data: null, error: null };
}

export async function deleteCategoryAction(
  categoryId: string,
  storeId: string,
): Promise<SettingsActionResult> {
  const idCheck = z.uuid().safeParse(categoryId);
  const storeCheck = z.uuid().safeParse(storeId);
  if (!idCheck.success || !storeCheck.success) {
    return { data: null, error: "Invalid category delete request." };
  }

  const guard = await requireStoreManager(storeId);
  if (guard.error) return guard;

  const supabase = await createTypedServerClient();
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId)
    .eq("store_id", storeId);

  if (error) return { data: null, error: error.message };

  revalidatePath(`/dashboard/store/${storeId}/settings`);
  revalidatePath(`/dashboard/store/${storeId}/inventory`);
  return { data: null, error: null };
}

export async function removeMemberAction(
  memberId: string,
  storeId: string,
): Promise<SettingsActionResult> {
  const supabase = await createTypedServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { data: null, error: "Authentication required." };

  // Only owners can remove members
  const { data: callerMembership } = await supabase
    .from("store_members")
    .select("role")
    .eq("store_id", storeId)
    .eq("user_id", user.id)
    .single();

  if (!callerMembership || callerMembership.role !== "owner") {
    return { data: null, error: "Only store owners can remove members." };
  }

  // Cannot remove owner
  const { data: targetMembership } = await supabase
    .from("store_members")
    .select("role")
    .eq("id", memberId)
    .single();

  if (targetMembership?.role === "owner") {
    return { data: null, error: "Cannot remove the store owner." };
  }

  const { error } = await supabase
    .from("store_members")
    .delete()
    .eq("id", memberId)
    .eq("store_id", storeId);

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/store/${storeId}/settings`);
  revalidatePath(`/dashboard/store/${storeId}/team`);
  return { data: null, error: null };
}

const updateMemberRoleSchema = z.object({
  memberId: z.uuid(),
  storeId: z.uuid(),
  role: z.enum(["manager", "cashier", "viewer"]),
});

export async function updateMemberRoleAction(
  memberId: string,
  storeId: string,
  role: "manager" | "cashier" | "viewer",
): Promise<SettingsActionResult> {
  const parsed = updateMemberRoleSchema.safeParse({ memberId, storeId, role });
  if (!parsed.success) {
    return { data: null, error: "Invalid role update request." };
  }

  const supabase = await createTypedServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { data: null, error: "Authentication required." };

  const { data: callerMembership } = await supabase
    .from("store_members")
    .select("role")
    .eq("store_id", parsed.data.storeId)
    .eq("user_id", user.id)
    .single();

  if (!callerMembership || callerMembership.role !== "owner") {
    return { data: null, error: "Only store owners can edit member roles." };
  }

  const { data: targetMembership } = await supabase
    .from("store_members")
    .select("role")
    .eq("id", parsed.data.memberId)
    .eq("store_id", parsed.data.storeId)
    .single();

  if (!targetMembership) {
    return { data: null, error: "Staff member not found." };
  }

  if (targetMembership.role === "owner") {
    return { data: null, error: "Cannot change the store owner's role." };
  }

  const { error } = await supabase
    .from("store_members")
    .update({ role: parsed.data.role })
    .eq("id", parsed.data.memberId)
    .eq("store_id", parsed.data.storeId);

  if (error) return { data: null, error: error.message };

  revalidatePath(`/dashboard/store/${parsed.data.storeId}/settings`);
  revalidatePath(`/dashboard/store/${parsed.data.storeId}/team`);
  return { data: null, error: null };
}

// ─── Invite codes ─────────────────────────────────────────────────────────────

export interface InviteCodeRow {
  id: string;
  code: string;
  role: string;
  used_count: number;
  max_uses: number;
  expires_at: string | null;
  note: string | null;
  is_revoked: boolean;
}

export async function getStoreInviteCodes(storeId: string): Promise<InviteCodeRow[]> {
  const supabase = await createTypedServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from("invite_codes")
    .select("id, code, role, used_count, max_uses, expires_at, note, is_revoked")
    .eq("store_id", storeId)
    .eq("is_revoked", false)
    .order("created_at", { ascending: false })
    .returns<InviteCodeRow[]>();

  return data ?? [];
}

export async function revokeInviteCodeAction(
  codeId: string,
  storeId: string,
): Promise<SettingsActionResult> {
  const supabase = await createTypedServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { data: null, error: "Authentication required." };

  const { data: membership } = await supabase
    .from("store_members")
    .select("role")
    .eq("store_id", storeId)
    .eq("user_id", user.id)
    .single();

  if (!membership || !["owner", "manager"].includes(membership.role)) {
    return { data: null, error: "Insufficient permissions." };
  }

  const { error } = await supabase
    .from("invite_codes")
    .update({ is_revoked: true })
    .eq("id", codeId)
    .eq("store_id", storeId);

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/store/${storeId}/settings`);
  revalidatePath(`/dashboard/store/${storeId}/team`);
  return { data: null, error: null };
}

// ─── Store General Settings ───────────────────────────────────────────────────

const updateStoreSchema = z.object({
  storeId: z.uuid(),
  name: z.string().min(1).max(100).trim(),
  address: z.string().max(300).trim().optional(),
  taxRate: z.number().min(0).max(100),
  receiptHeader: z.string().max(500).trim().optional(),
  receiptFooter: z.string().max(500).trim().optional(),
  currencyCode: z.string().length(3).trim().toUpperCase(),
  currencySymbol: z.string().min(1).max(10).trim(),
  currencyDecimals: z.number().int().min(0).max(4),
  symbolPosition: z.enum(["prefix", "suffix"]),
  costMethod: z.enum(["fifo", "lifo"]).default("fifo"),
});

export async function updateStoreSettingsAction(
  _prevState: SettingsActionResult,
  formData: FormData,
): Promise<SettingsActionResult> {
  const parsed = updateStoreSchema.safeParse({
    storeId: formData.get("storeId"),
    name: formData.get("name"),
    address: formData.get("address") || undefined,
    taxRate: parseFloat(formData.get("taxRate") as string) || 0,
    receiptHeader: formData.get("receiptHeader") || undefined,
    receiptFooter: formData.get("receiptFooter") || undefined,
    currencyCode: formData.get("currencyCode"),
    currencySymbol: formData.get("currencySymbol"),
    currencyDecimals: parseInt(formData.get("currencyDecimals") as string) || 0,
    symbolPosition: formData.get("symbolPosition"),
    costMethod: (formData.get("costMethod") as string) || "fifo",
  });

  if (!parsed.success) {
    return { data: null, error: "Invalid input. Please check all fields." };
  }

  const supabase = await createTypedServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { data: null, error: "Authentication required." };

  const { data: membership } = await supabase
    .from("store_members")
    .select("role")
    .eq("store_id", parsed.data.storeId)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.role !== "owner") {
    return { data: null, error: "Only store owners can edit store settings." };
  }

  const { error } = await supabase
    .from("stores")
    .update({
      name: parsed.data.name,
      address: parsed.data.address ?? null,
      tax_rate: parsed.data.taxRate,
      receipt_header: parsed.data.receiptHeader ?? null,
      receipt_footer: parsed.data.receiptFooter ?? null,
      currency_code: parsed.data.currencyCode,
      currency_symbol: parsed.data.currencySymbol,
      currency_decimals: parsed.data.currencyDecimals,
      symbol_position: parsed.data.symbolPosition,
      cost_method: parsed.data.costMethod,
    })
    .eq("id", parsed.data.storeId);

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/store/${parsed.data.storeId}/settings`);
  revalidatePath(`/dashboard/store/${parsed.data.storeId}/pos`);
  revalidatePath("/dashboard");
  return { data: null, error: null };
}

// ─── QR Channels ─────────────────────────────────────────────────────────────

export async function getQrChannels(storeId: string): Promise<QrChannelRow[]> {
  const supabase = await createTypedServerClient();
  const { data } = await supabase
    .from("qr_channels")
    .select("id, label, image_url, is_enabled, sort_order")
    .eq("store_id", storeId)
    .order("sort_order", { ascending: true })
    .returns<QrChannelRow[]>();

  return data ?? [];
}

export async function createQrChannelAction(
  _prevState: SettingsActionResult,
  formData: FormData,
): Promise<SettingsActionResult> {
  const storeId = formData.get("storeId") as string;
  const label = (formData.get("label") as string)?.trim();
  const imageFile = formData.get("imageFile");

  if (!storeId || !label) {
    return { data: null, error: "Label is required." };
  }

  if (!(imageFile instanceof File) || imageFile.size === 0) {
    return { data: null, error: "QR image is required." };
  }

  if (!imageFile.type.startsWith("image/")) {
    return { data: null, error: "QR image must be an image file." };
  }

  const maxSizeBytes = 5 * 1024 * 1024;
  if (imageFile.size > maxSizeBytes) {
    return { data: null, error: "Image must be 5MB or smaller." };
  }

  const supabase = await createTypedServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { data: null, error: "Authentication required." };

  const { data: membership } = await supabase
    .from("store_members")
    .select("role")
    .eq("store_id", storeId)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.role !== "owner") {
    return { data: null, error: "Only store owners can manage QR channels." };
  }

  const bucket = process.env.SUPABASE_ASSETS_BUCKET ?? "app-assets";
  const safeFileName = imageFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const objectPath = `stores/${storeId}/qr-channels/${Date.now()}-${safeFileName}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(objectPath, imageFile, {
      upsert: false,
      contentType: imageFile.type,
    });

  if (uploadError) {
    if (/bucket.*not found/i.test(uploadError.message)) {
      return {
        data: null,
        error:
          `Storage bucket "${bucket}" was not found. ` +
          "Create it in Supabase Storage, then retry.",
      };
    }

    return { data: null, error: `Image upload failed: ${uploadError.message}` };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(objectPath);

  if (!publicUrl) {
    return { data: null, error: "Unable to get uploaded image URL." };
  }

  const { error } = await supabase.from("qr_channels").insert({
    store_id: storeId,
    label,
    image_url: publicUrl,
    created_by: user.id,
  });

  if (error) {
    await supabase.storage.from(bucket).remove([objectPath]);
    return { data: null, error: error.message };
  }

  revalidatePath(`/dashboard/store/${storeId}/settings`);
  return { data: null, error: null };
}

export async function toggleQrChannelAction(
  channelId: string,
  storeId: string,
  isEnabled: boolean,
): Promise<SettingsActionResult> {
  const supabase = await createTypedServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { data: null, error: "Authentication required." };

  const { data: membership } = await supabase
    .from("store_members")
    .select("role")
    .eq("store_id", storeId)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.role !== "owner") {
    return { data: null, error: "Only store owners can manage QR channels." };
  }

  const { error } = await supabase
    .from("qr_channels")
    .update({ is_enabled: isEnabled, updated_at: new Date().toISOString() })
    .eq("id", channelId)
    .eq("store_id", storeId);

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/store/${storeId}/settings`);
  revalidatePath(`/dashboard/store/${storeId}/pos`);
  return { data: null, error: null };
}

export async function deleteQrChannelAction(
  channelId: string,
  storeId: string,
): Promise<SettingsActionResult> {
  const supabase = await createTypedServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { data: null, error: "Authentication required." };

  const { data: membership } = await supabase
    .from("store_members")
    .select("role")
    .eq("store_id", storeId)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.role !== "owner") {
    return { data: null, error: "Only store owners can delete QR channels." };
  }

  const { error } = await supabase
    .from("qr_channels")
    .delete()
    .eq("id", channelId)
    .eq("store_id", storeId);

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/store/${storeId}/settings`);
  revalidatePath(`/dashboard/store/${storeId}/pos`);
  return { data: null, error: null };
}


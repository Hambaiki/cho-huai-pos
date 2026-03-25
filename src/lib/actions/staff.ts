"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const inviteStaffSchema = z.object({
  storeId: z.string().uuid(),
  email: z.string().email().trim().toLowerCase(),
  role: z.enum(["manager", "cashier", "viewer"]), // Exclude 'owner' role
  note: z.string().max(255).optional(),
});

export interface StaffActionState {
  error: string | null;
  data?: {
    message?: string;
  };
}

export async function inviteStaffAction(
  _prevState: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  const parsed = inviteStaffSchema.safeParse({
    storeId: formData.get("storeId"),
    email: formData.get("email"),
    role: formData.get("role"),
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

  const { data: inviteResult, error: inviteError } = await supabase.rpc(
    "invite_staff_by_email",
    {
      p_store_id: parsed.data.storeId,
      p_email: parsed.data.email,
      p_role: parsed.data.role,
      p_note: parsed.data.note ?? null,
    },
  );

  if (inviteError) {
    return { error: "Failed to invite staff by email. Please try again." };
  }

  const resultRow = Array.isArray(inviteResult)
    ? (inviteResult[0] as { status?: string; message?: string } | undefined)
    : undefined;

  if (!resultRow || resultRow.status === "error") {
    return {
      error: resultRow?.message ?? "Unable to process this invite.",
    };
  }

  revalidatePath(`/dashboard/store/${parsed.data.storeId}/team`);
  revalidatePath(`/dashboard/store/${parsed.data.storeId}/settings`);

  return {
    error: null,
    data: {
      message: resultRow.message ?? "Staff member invited successfully.",
    },
  };
}

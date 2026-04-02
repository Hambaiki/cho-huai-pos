import { createClient } from "@/lib/supabase/server";
import { getStaffMembers } from "./actions";
import { StaffMember, StoreMemberRole } from "./types";

export async function getSettingsPageData({
  userId,
  storeId,
}: {
  userId: string;
  storeId: string;
}) {
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("store_members")
    .select("store_id, role")
    .eq("user_id", userId)
    .eq("store_id", storeId)
    .maybeSingle();

  if (!membership?.store_id) return null;

  const [{ data: store }, { data: qrChannels }, { data: categories }] =
    await Promise.all([
      supabase
        .from("stores")
        .select(
          "id, name, address, tax_rate, max_cashier_order_discount_amount, max_cashier_order_discount_percentage, receipt_header, receipt_footer, currency_code, currency_symbol, currency_decimals, symbol_position, cost_method",
        )
        .eq("id", storeId)
        .maybeSingle(),
      supabase
        .from("qr_channels")
        .select("id, label, image_url, is_enabled, sort_order")
        .eq("store_id", storeId)
        .order("sort_order", { ascending: true }),
      supabase
        .from("categories")
        .select("id, name, sort_order")
        .eq("store_id", storeId)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),
    ]);

  if (!store) return null;

  return {
    role: membership.role as StoreMemberRole,
    store,
    qrChannels: qrChannels ?? [],
    categories: categories ?? [],
  };
}

export async function getTeamPageData({
  userId,
  storeId,
}: {
  userId: string;
  storeId: string;
}) {
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("store_members")
    .select("store_id, role")
    .eq("user_id", userId)
    .eq("store_id", storeId)
    .maybeSingle();

  if (!membership?.store_id) return null;

  const staffMembers: StaffMember[] = await getStaffMembers(storeId);

  return {
    role: membership.role as StoreMemberRole,
    staffMembers,
  };
}

export async function getStoreLayoutData({
  userId,
  storeId,
}: {
  userId: string;
  storeId: string;
}) {
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("store_members")
    .select("role")
    .eq("user_id", userId)
    .eq("store_id", storeId)
    .maybeSingle();

  if (!membership) return null;

  const { data: store } = await supabase
    .from("stores")
    .select(
      "id, name, is_suspended, currency_code, currency_symbol, currency_decimals, symbol_position, tax_rate",
    )
    .eq("id", storeId)
    .maybeSingle();

  if (!store) return null;

  return {
    role: membership.role,
    store,
  };
}

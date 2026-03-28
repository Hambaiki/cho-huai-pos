"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createTypedServerClient } from "@/lib/supabase/typed-client";
import { DEFAULT_CURRENCY } from "@/lib/utils/currency";

const createStoreSchema = z.object({
  name: z.string().min(2).max(120).trim(),
  address: z.string().max(300).optional(),
  currency_code: z.string().min(3).max(3).transform((value) => value.toUpperCase()),
  currency_symbol: z.string().min(1).max(6).trim(),
  currency_decimals: z.coerce.number().int().min(0).max(4),
  symbol_position: z.enum(["prefix", "suffix"]),
});

export interface CreateStoreActionState {
  error: string | null;
}

export async function createStoreAction(
  _prevState: CreateStoreActionState,
  formData: FormData,
): Promise<CreateStoreActionState> {
  const parsed = createStoreSchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address"),
    currency_code: formData.get("currency_code") || DEFAULT_CURRENCY.currency_code,
    currency_symbol:
      formData.get("currency_symbol") || DEFAULT_CURRENCY.currency_symbol,
    currency_decimals:
      formData.get("currency_decimals") ?? DEFAULT_CURRENCY.currency_decimals,
    symbol_position:
      formData.get("symbol_position") || DEFAULT_CURRENCY.symbol_position,
  });

  if (!parsed.success) {
    return { error: "Please check the store details and try again." };
  }

  const supabase = await createTypedServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Please sign in again." };
  }

  // Check store limit before creating
  const { data: userProfile } = await supabase
    .from("profiles")
    .select("store_limit_override")
    .eq("id", user.id)
    .maybeSingle();

  // Get current store count
  const { count: currentStoreCount } = await supabase
    .from("stores")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id);

  let effectiveLimit = 3; // Fallback

  // Try to get default from site settings
  const { data: settings } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "default_store_limit_per_account")
    .maybeSingle();

  if (settings?.value && /^\d+$/.test(settings.value)) {
    effectiveLimit = parseInt(settings.value, 10);
  }

  // Override wins if set
  if (userProfile?.store_limit_override) {
    effectiveLimit = userProfile.store_limit_override;
  }

  if ((currentStoreCount ?? 0) >= effectiveLimit) {
    return {
      error: `You have reached your store limit (${effectiveLimit} stores). Contact support to increase your limit.`,
    };
  }

  const { data: store, error: storeError } = await supabase
    .from("stores")
    .insert({
      owner_id: user.id,
      name: parsed.data.name,
      address: parsed.data.address || null,
      currency_code: parsed.data.currency_code,
      currency_symbol: parsed.data.currency_symbol,
      currency_decimals: parsed.data.currency_decimals,
      symbol_position: parsed.data.symbol_position,
    })
    .select("id")
    .single();

  if (storeError || !store) {
    return { error: storeError?.message ?? "Could not create store." };
  }

  const { error: memberError } = await supabase.from("store_members").insert({
    store_id: store.id,
    user_id: user.id,
    role: "owner",
  });

  if (memberError) {
    return { error: memberError.message };
  }

  redirect(`/dashboard/store/${store.id}`);
}

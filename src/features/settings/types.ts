import { Tables } from "@/lib/supabase/types";

export type SettingsActionResult<T = null> =
  | { data: T; error: null }
  | { data: null; error: string };

export type StoreMemberRole = Tables<"store_members">["role"];

export type StoreData = Pick<
  Tables<"stores">,
  | "id"
  | "name"
  | "address"
  | "tax_rate"
  | "receipt_header"
  | "receipt_footer"
  | "currency_code"
  | "currency_symbol"
  | "currency_decimals"
  | "symbol_position"
  | "cost_method"
>;

export type QrChannelRow = Pick<
  Tables<"qr_channels">,
  "id" | "label" | "image_url" | "is_enabled" | "sort_order"
>;

export type CategoryRow = Pick<
  Tables<"categories">,
  "id" | "name" | "sort_order"
>;

export interface StaffMember {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  role: StoreMemberRole;
  joinedAt: string;
}

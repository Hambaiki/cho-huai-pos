import { Database } from "@/lib/supabase/types";

export type Store = Database["public"]["Tables"]["stores"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export interface AdminDashboardStats {
  storeCount: number | null;
  userCount: number | null;
  orderCount: number | null;
  pendingCount: number | null;
  totalRevenue: number;
  bnplOutstanding: number;
  recentStores: Pick<
    Store,
    "id" | "name" | "currency_code" | "is_suspended" | "created_at"
  >[];
  recentUsers: Pick<
    Profile,
    "id" | "display_name" | "is_provisioned" | "is_suspended" | "created_at"
  >[];
}

export type AdminStore = Pick<
  Store,
  | "id"
  | "name"
  | "currency_code"
  | "is_suspended"
  | "staff_limit_override"
  | "created_at"
>;

export type AdminProfile = Pick<
  Profile,
  | "id"
  | "display_name"
  | "is_super_admin"
  | "is_suspended"
  | "store_limit_override"
  | "created_at"
>;

export interface AdminStoreLinkedDataSummary {
  memberCount: number;
  productCount: number;
  orderCount: number;
  completedRevenue: number;
  bnplAccountCount: number;
  bnplOutstanding: number;
}

export interface AdminUserLinkedDataSummary {
  membershipCount: number;
  ownedStoreCount: number;
  cashierOrderCount: number;
  cashierSalesTotal: number;
}

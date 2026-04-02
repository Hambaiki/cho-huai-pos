import { Tables } from "@/lib/supabase/types";

export interface StoreItem {
  id: string;
  name: string;
  address: string | null;
  isSuspended: boolean;
  createdAt: string;
  role: Tables<"store_members">["role"];
}

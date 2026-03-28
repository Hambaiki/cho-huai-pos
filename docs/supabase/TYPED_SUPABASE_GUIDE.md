/**
 * TYPED SUPABASE IMPLEMENTATION - Quick Reference Guide
 * 
 * This document shows the patterns you should follow to maintain type safety
 * across your codebase as it grows.
 */

// ════════════════════════════════════════════════════════════════════════════
// 1. USING THE TYPED CLIENT IN SERVER ACTIONS
// ════════════════════════════════════════════════════════════════════════════

import { createTypedServerClient } from "@/lib/supabase/typed-client";

export async function myServerAction() {
  const supabase = await createTypedServerClient();
  
  // Now ALL queries are fully typed!
  const { data: users } = await supabase
    .from("profiles")
    .select("id, email, is_super_admin") // TypeScript knows these columns exist
    .eq("is_super_admin", true);
  
  // data type is inferred as: { id: string; email: string; is_super_admin: boolean }[]
  return users;
}

// ════════════════════════════════════════════════════════════════════════════
// 2. ORGANIZING DATA FETCHING IN lib/queries/
// ════════════════════════════════════════════════════════════════════════════

// Location: src/lib/queries/dashboard.ts
import { createTypedServerClient } from "@/lib/supabase/typed-client";

export async function getUserDashboardData(userId: string) {
  const supabase = await createTypedServerClient();
  
  // Bundle related queries into focused functions
  const [{ data: profile }, { count: storeCount }] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", userId).maybeSingle(),
    supabase.from("store_members").select("*", { count: "exact", head: true }).eq("user_id", userId),
  ]);
  
  return { displayName: profile?.display_name || "User", storeCount };
}

// ════════════════════════════════════════════════════════════════════════════
// 3. USING QUERIES IN SERVER COMPONENTS
// ════════════════════════════════════════════════════════════════════════════

// Location: src/app/dashboard/page.tsx
import { createTypedServerClient } from "@/lib/supabase/typed-client";
import { getUserDashboardData } from "@/lib/queries/dashboard";

export default async function DashboardPage() {
  const supabase = await createTypedServerClient();
  
  // Get auth user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  
  // Fetch data using organized query functions
  const data = await getUserDashboardData(user.id);
  
  return (
    <div>
      <h1>Welcome {data.displayName}</h1>
      <p>You have {data.storeCount} stores</p>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 4. USING TYPED CLIENT IN CLIENT COMPONENTS (React hooks, etc)
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { createTypedBrowserClient } from "@/lib/supabase/typed-client";
import { useEffect, useState } from "react";

export function StoreList() {
  const [stores, setStores] = useState([]);
  const supabase = createTypedBrowserClient();
  
  useEffect(() => {
    const fetchStores = async () => {
      const { data } = await supabase
        .from("stores")
        .select("id, name, description");
      setStores(data ?? []);
    };
    
    fetchStores();
  }, [supabase]);
  
  return (
    <ul>
      {stores.map(store => (
        <li key={store.id}>{store.name}</li>
      ))}
    </ul>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 5. GETTING TYPES FROM GENERATED DATABASE SCHEMA
// ════════════════════════════════════════════════════════════════════════════

import type { Database } from "@/lib/supabase/types";

// Get table row type
type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Store = Database["public"]["Tables"]["stores"]["Row"];

// Get insert/update types (without auto-incrementing fields)
type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
type StoreUpdate = Database["public"]["Tables"]["stores"]["Update"];

// Use in functions
function updateProfile(profile: ProfileInsert) {
  const supabase = await createTypedServerClient();
  return supabase.from("profiles").insert(profile);
}

// ════════════════════════════════════════════════════════════════════════════
// 6. FOLDER STRUCTURE (recommended)
// ════════════════════════════════════════════════════════════════════════════

/*
src/
  lib/
    supabase/
      types.ts              ← Auto-generated after migrations
      server.ts             ← Create server client
      client.ts             ← Create browser client
      typed-client.ts       ← NEW: Typed wrappers (you created this!)
      middleware.ts
    queries/                ← NEW: Organize all data fetching here
      dashboard.ts          ← Dashboard-related queries
      inventory.ts          ← Inventory-related queries
      orders.ts             ← Order-related queries
      admin.ts              ← Admin-related queries
    actions/                ← Server actions (mutations)
      admin.ts
      orders.ts
      etc.
*/

// ════════════════════════════════════════════════════════════════════════════
// 7. MIGRATION WORKFLOW
// ════════════════════════════════════════════════════════════════════════════

/*
1. Create a new migration:
   supabase migration new add_my_table
   
2. Write SQL in supabase/migrations/XXXX_add_my_table.sql

3. Run locally:
   supabase migration up

4. REGENERATE TYPES (important!):
   supabase gen types typescript --local > src/lib/supabase/types.ts

5. Commit changes:
   git add supabase/migrations/XXXX_add_my_table.sql src/lib/supabase/types.ts
   git commit -m "Add my_table migration"
*/

// ════════════════════════════════════════════════════════════════════════════
// 8. BENEFITS SUMMARY
// ════════════════════════════════════════════════════════════════════════════

/*
✅ TYPE SAFETY
   - Catch typos in column names at compile time
   - Return types inferred from .select() expressions
   - IDE autocomplete for all Supabase operations

✅ MAINTAINABILITY
   - Change a query once, used everywhere
   - Clear separation: queries in lib/queries/, mutations in lib/actions/
   - Easy to trace data flow

✅ REUSABILITY
   - Share queries across pages and components
   - Compose queries together
   - Test queries independently

✅ CONSISTENCY
   - Standard patterns across the team
   - Reduced code duplication
   - Clear conventions
*/

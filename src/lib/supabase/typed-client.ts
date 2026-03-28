import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { createClient as createServerClient } from "./server";
import { createClient as createBrowserClient } from "./client";

/**
 * Create a typed Supabase server client with full type safety.
 * Use in Server Components and Server Actions.
 * 
 * @example
 * const supabase = await createTypedServerClient();
 * const { data } = await supabase.from("profiles").select("id, email");
 */
export async function createTypedServerClient() {
  return createServerClient() as Promise<SupabaseClient<Database>>;
}

/**
 * Create a typed Supabase browser client with full type safety.
 * Use in Client Components and browser contexts.
 * 
 * @example
 * const supabase = createTypedBrowserClient();
 * const { data } = await supabase.from("profiles").select("id, email");
 */
export function createTypedBrowserClient() {
  return createBrowserClient() as SupabaseClient<Database>;
}

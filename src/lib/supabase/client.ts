import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

/**
 * Create a typed Supabase browser client with full type safety.
 * Use in Client Components and browser contexts.
 *
 * @example
 * const supabase = createClient();
 * const { data } = await supabase.from("profiles").select("id, email");
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase browser environment variables.");
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}

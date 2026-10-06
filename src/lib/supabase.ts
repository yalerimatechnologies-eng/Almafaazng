import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL. Add it to .env.local and restart the dev server."
  );
}
if (!key) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Add it to .env.local and restart the dev server."
  );
}

let client: SupabaseClient | null = null;

/**
 * Lazy singleton. Safe to call from any client component.
 */
export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createClient(url!, key!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return client;
}

/**
 * Eager export kept for components that already import `{ supabase }`.
 * Never use a service-role key here — this bundle ships to the browser.
 */
export const supabase = getSupabase();

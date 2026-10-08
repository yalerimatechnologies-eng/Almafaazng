import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL. Add it to .env.local and restart the dev server.",
  );
}

if (!supabasePublishableKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Add it to .env.local and restart the dev server.",
  );
}

const url: string = supabaseUrl;
const key: string = supabasePublishableKey;

let client: SupabaseClient | null = null;

/**
 * Browser Supabase client.
 *
 * Uses @supabase/ssr so the authenticated session can be
 * synchronized with the Next.js server through cookies.
 *
 * Never use a service-role key here.
 */
export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createBrowserClient(url, key);
  }

  return client;
}

/**
 * Existing components import `{ supabase }`, so keep the
 * same public API.
 */
export const supabase = getSupabase();

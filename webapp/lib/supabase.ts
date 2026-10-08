import { createClient } from "@supabase/supabase-js";

// Server-only client. Uses the service_role key, which bypasses Row Level
// Security — this file must never be imported from a Client Component.
// All DB access happens in Server Components / Route Handlers.
export function supabaseServer() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY env vars. Set them in .env.local (dev) or Vercel project settings (prod)."
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

// lib/supabase.ts
// Phase 6 — Supabase client singleton (ADR 0006).
//
// Auth strategy: email magic link via PKCE flow. PKCE is the recommended
// flow for SPAs / mobile (no server-side secret needed; the browser proves
// possession of the code verifier).
//
// Session persistence:
//   - localStorage by default — survives tab close + browser restart.
//   - detectSessionInUrl: parses the magic-link callback URL automatically
//     when /auth/callback loads.
//
// Cloud sync is OPTIONAL (ADR 0006). Users who never log in stay 100%
// local-only — this module just sits idle and consumes no network.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!URL) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL — see docs/supabase-schema.sql header for setup.",
  );
}
if (!ANON_KEY) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY — see docs/supabase-schema.sql header for setup.",
  );
}

export const supabase: SupabaseClient = createClient(URL, ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
});

export type { User, Session, AuthError } from "@supabase/supabase-js";

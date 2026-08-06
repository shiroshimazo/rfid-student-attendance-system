import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getPublicSupabaseConfig } from "./env";

export function createAdminClient() {
  const { url } = getPublicSupabaseConfig();
  const secretKey =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secretKey) {
    throw new Error("SUPABASE_SECRET_KEY is required on the server.");
  }

  return createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

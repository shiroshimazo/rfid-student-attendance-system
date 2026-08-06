"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getPublicSupabaseConfig } from "./env";

let browserClient: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  if (!browserClient) {
    const { url, publishableKey } = getPublicSupabaseConfig();
    browserClient = createBrowserClient(url, publishableKey);
  }

  return browserClient;
}

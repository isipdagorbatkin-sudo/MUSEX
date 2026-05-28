"use client";

import { createBrowserClient } from "@supabase/ssr";
import { requireSupabaseEnv } from "./env";
import type { Database } from "./types";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function createClient() {
  if (browserClient) return browserClient;

  const { supabaseUrl, supabaseAnonKey } = requireSupabaseEnv();
  browserClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
  return browserClient;
}


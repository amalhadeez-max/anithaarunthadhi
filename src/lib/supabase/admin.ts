import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicEnv, requiredEnv } from "@/lib/env";

/** Service-role client — bypasses RLS. Server only. Used for storage uploads & admin auth ops. */
export function createAdminClient() {
  return createClient(publicEnv.supabaseUrl, requiredEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "media";

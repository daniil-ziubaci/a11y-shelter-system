import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

let client: ReturnType<typeof createClient<Database>> | undefined;

// Public pages read only public data, so one client without cookies is shared.
export function getSupabase() {
  client ??= createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  return client;
}

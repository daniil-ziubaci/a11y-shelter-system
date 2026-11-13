import { createServerClient, parseCookieHeader } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AstroCookies } from "astro";
import { SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from "astro:env/server";
import type { Database } from "@/lib/database";

export type Supabase = SupabaseClient<Database>;

const noSession = { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false };

let publicClient: Supabase | undefined;
let adminClient: Supabase | undefined;

export function getPublicClient(): Supabase {
  publicClient ??= createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: noSession });
  return publicClient;
}

export function getAdminClient(): Supabase {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }
  adminClient ??= createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: noSession });
  return adminClient;
}

export function createSessionClient(request: Request, cookies: AstroCookies, responseHeaders: Headers): Supabase {
  return createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return parseCookieHeader(request.headers.get("cookie") ?? "").map(({ name, value }) => ({
          name,
          value: value ?? "",
        }));
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value, options } of cookiesToSet) {
          cookies.set(name, value, {
            ...options,
            sameSite: options.sameSite === true ? "strict" : options.sameSite === false ? undefined : options.sameSite,
          });
        }
        for (const [key, value] of Object.entries(headers)) {
          responseHeaders.set(key, value);
        }
      },
    },
  });
}

export function publicPhotoUrl(path: string): string {
  return `${new URL(SUPABASE_URL).origin}/storage/v1/object/public/pet-photos/${path}`;
}

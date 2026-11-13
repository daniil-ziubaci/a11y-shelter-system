import type { APIRoute } from "astro";

const LINK_TYPES = ["invite", "recovery"] as const;

export const GET: APIRoute = async ({ url, locals, redirect }) => {
  const tokenHash = url.searchParams.get("token_hash");
  const type = LINK_TYPES.find((value) => value === url.searchParams.get("type"));
  if (!tokenHash || !type) {
    return redirect("/login?error=invite", 303);
  }
  const { error } = await locals.supabase.auth.verifyOtp({ type, token_hash: tokenHash });
  return redirect(error ? "/login?error=invite" : "/auth/set-password", 303);
};

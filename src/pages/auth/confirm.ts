import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ url, locals, redirect }) => {
  const tokenHash = url.searchParams.get("token_hash");
  if (!tokenHash || url.searchParams.get("type") !== "invite") {
    return redirect("/login?error=invite", 303);
  }
  const { error } = await locals.supabase.auth.verifyOtp({ type: "invite", token_hash: tokenHash });
  return redirect(error ? "/login?error=invite" : "/auth/set-password", 303);
};

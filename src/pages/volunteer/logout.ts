import type { APIRoute } from "astro";
import { methodNotAllowed } from "@/lib/methods";

export const POST: APIRoute = async ({ locals, redirect }) => {
  await locals.supabase.auth.signOut({ scope: "local" });
  return redirect("/login", 303);
};

export const GET: APIRoute = ({ redirect }) => redirect("/volunteer", 303);

export const ALL = methodNotAllowed("POST");

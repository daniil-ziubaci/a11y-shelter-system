import type { APIRoute } from "astro";
import { getPublicClient } from "@/lib/supabase";

const noStore = { "Cache-Control": "no-store" };

export const GET: APIRoute = async () => {
  const { error } = await getPublicClient()
    .from("shelter")
    .select("id")
    .limit(1)
    .abortSignal(AbortSignal.timeout(8000));
  if (error) {
    return Response.json({ status: "error" }, { status: 503, headers: noStore });
  }
  return Response.json({ status: "ok" }, { headers: noStore });
};

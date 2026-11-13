import { createHash, timingSafeEqual } from "node:crypto";
import type { APIRoute } from "astro";
import { CRON_SECRET } from "astro:env/server";
import { translateStale } from "@/lib/translateStale";

function sameSecret(received: string, expected: string): boolean {
  const digest = (text: string) => createHash("sha256").update(text).digest();
  return timingSafeEqual(digest(received), digest(expected));
}

export const GET: APIRoute = async ({ request }) => {
  if (!CRON_SECRET || !sameSecret(request.headers.get("authorization") ?? "", `Bearer ${CRON_SECRET}`)) {
    return new Response("Unauthorized", { status: 401 });
  }
  const report = await translateStale(Date.now() + 45_000);
  return Response.json(report, { headers: { "Cache-Control": "no-store" } });
};

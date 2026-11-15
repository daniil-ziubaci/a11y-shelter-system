import type { APIRoute } from "astro";

export function methodNotAllowed(allow: string): APIRoute {
  return () => new Response("Method Not Allowed", { status: 405, headers: { Allow: allow, "Content-Type": "text/plain; charset=utf-8" } });
}

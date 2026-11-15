import type { APIRoute } from "astro";
import { ALLOW_INDEXING, SITE_URL } from "astro:env/server";
import { methodNotAllowed } from "@/lib/methods";

export const GET: APIRoute = () => {
  const lines = ["User-Agent: *", "Allow: /", "Disallow: /volunteer/", "Disallow: /login", "Disallow: /auth/"];
  if (ALLOW_INDEXING === "true") {
    lines.push("", `Sitemap: ${SITE_URL.replace(/\/$/, "")}/sitemap.xml`);
  }
  return new Response(`${lines.join("\n")}\n`, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};

export const HEAD = GET;

export const ALL = methodNotAllowed("GET, HEAD");

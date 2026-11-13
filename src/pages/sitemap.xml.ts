import type { APIRoute } from "astro";
import { ALLOW_INDEXING, SITE_URL } from "astro:env/server";
import { LOCALES } from "@/lib/i18n";
import { PUBLIC_PET_STATUSES } from "@/lib/petStatuses";
import { fetchAll } from "@/lib/supabase/fetchAll";
import { getPublicClient } from "@/lib/supabase";

const escape = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;");

export const GET: APIRoute = async () => {
  const paths: string[] = [];
  if (ALLOW_INDEXING === "true") {
    const supabase = getPublicClient();
    const [pets, projects] = await Promise.all([
      fetchAll((from, to) => supabase.from("pets").select("id").in("status", PUBLIC_PET_STATUSES).order("id").range(from, to)),
      supabase.from("projects").select("id").eq("is_archived", false).limit(1),
    ]);
    paths.push("", "/catalog", "/needs", "/about");
    if ((projects.data ?? []).length > 0) paths.push("/projects");
    paths.push(...pets.map((pet) => `/catalog/${pet.id}`));
  }
  const site = SITE_URL.replace(/\/$/, "");
  const urls = paths.flatMap((path) =>
    LOCALES.map((code) => {
      const alternates = LOCALES.map(
        (other) => `<xhtml:link rel="alternate" hreflang="${other}" href="${escape(`${site}/${other}${path}`)}"/>`,
      ).join("");
      return `<url><loc>${escape(`${site}/${code}${path}`)}</loc>${alternates}</url>`;
    }),
  );
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls.join("")}</urlset>\n`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};

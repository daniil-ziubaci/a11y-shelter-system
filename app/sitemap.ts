import { routing } from "@/i18n/routing";
import { isIndexingAllowed } from "@/lib/indexing";
import { PUBLIC_PET_STATUSES } from "@/lib/petStatuses";
import { createClient } from "@/lib/supabase/server";
import { fetchAll } from "@/lib/supabase/fetchAll";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!isIndexingAllowed()) {
    return [];
  }
  const siteUrl = process.env.SITE_URL!;
  const supabase = await createClient();

  const shelters = await fetchAll((from, to) =>
    supabase.from("shelters").select("id, slug").order("id").range(from, to),
  );
  const pets = await fetchAll((from, to) =>
    supabase
      .from("pets")
      .select("id, shelter_id")
      .in("status", PUBLIC_PET_STATUSES)
      .order("id")
      .range(from, to),
  );
  const projects = await fetchAll((from, to) =>
    supabase
      .from("projects")
      .select("shelter_id")
      .eq("is_archived", false)
      .order("id")
      .range(from, to),
  );

  const paths: string[] = [];

  const sheltersWithProjects = new Set(projects.map((p) => p.shelter_id));

  for (const shelter of shelters) {
    const base = `/shelter/${shelter.slug}`;
    paths.push(base, `${base}/catalog`, `${base}/needs`, `${base}/about`);
    if (sheltersWithProjects.has(shelter.id)) {
      paths.push(`${base}/projects`);
    }
    for (const pet of pets) {
      if (pet.shelter_id === shelter.id) {
        paths.push(`${base}/catalog/${pet.id}`);
      }
    }
  }

  return paths.flatMap((path) => {
    const languages: Record<string, string> = {};
    for (const code of routing.locales) {
      languages[code] = `${siteUrl}/${code}${path}`;
    }
    return routing.locales.map((code) => ({
      url: `${siteUrl}/${code}${path}`,
      alternates: { languages },
    }));
  });
}

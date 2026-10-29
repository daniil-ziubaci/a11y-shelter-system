import { routing } from "@/i18n/routing";
import { PUBLIC_PET_STATUSES } from "@/lib/petStatuses";
import { createClient } from "@/lib/supabase/server";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.SITE_URL!;
  const supabase = await createClient();

  const { data: shelters, error: sheltersError } = await supabase
    .from("shelters")
    .select("id, slug");
  const { data: pets, error: petsError } = await supabase
    .from("pets")
    .select("id, shelter_id")
    .in("status", PUBLIC_PET_STATUSES);

  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("shelter_id");

  if (
    sheltersError ||
    petsError ||
    projectsError ||
    !shelters ||
    !pets ||
    !projects
  ) {
    throw new Error("Не удалось собрать карту сайта.");
  }

  const paths: string[] = [];

  const sheltersWithProjects = new Set(projects.map((p) => p.shelter_id));

  for (const shelter of shelters) {
    const base = `/shelter/${shelter.slug}`;
    paths.push(`${base}/catalog`, `${base}/about`);
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

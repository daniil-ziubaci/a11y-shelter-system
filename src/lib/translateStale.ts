import { getDeeplStatus } from "@/lib/deepl";
import { PUBLIC_PET_STATUSES } from "@/lib/petStatuses";
import { fetchAll } from "@/lib/supabase/fetchAll";
import { getAdminClient, type Supabase } from "@/lib/supabase";
import { itemTranslations, petTranslations, projectTranslations } from "@/lib/translate";
import { shelterTranslations } from "@/lib/translateShelter";
import { countNewEntries, readTranslations, sameTranslations, type Translations } from "@/lib/translations";

type Counts = { count: number; cleared: number };

type Row = { id: string; translations: Json };
type Json = import("@/lib/database").Json;

async function refresh<T extends Row>(
  supabase: Supabase,
  table: "pets" | "projects" | "purchase_items",
  rows: T[],
  build: (row: T) => Promise<Translations>,
  deadline: number,
): Promise<Counts> {
  const counts = { count: 0, cleared: 0 };
  for (const row of rows) {
    if (Date.now() > deadline) break;
    const translations = await build(row);
    const previous = readTranslations(row.translations);
    if (sameTranslations(translations, previous)) continue;
    const { error } = await supabase.from(table).update({ translations }).eq("id", row.id);
    if (error) {
      console.error(`translate ${table} failed`, row.id, error.message);
    } else if (countNewEntries(translations, previous) > 0) {
      counts.count += 1;
    } else {
      counts.cleared += 1;
    }
  }
  return counts;
}

export type TranslateReport = {
  shelters: number;
  items: number;
  projects: number;
  pets: number;
  cleared: number;
  deepl: string;
};

export async function translateStale(deadline: number): Promise<TranslateReport> {
  const status = await getDeeplStatus();
  const deepl = status.ok ? `ok, до порога 95% осталось ${status.remaining} символов` : status.reason;
  const supabase = getAdminClient();
  const report: TranslateReport = { shelters: 0, items: 0, projects: 0, pets: 0, cleared: 0, deepl };

  const { data: shelter } = await supabase
    .from("shelter")
    .select("content_language, about, adoption_info, legal_info, contact_hours, photo_alt, city, donation_text, translations")
    .maybeSingle();
  if (!shelter) {
    return report;
  }
  const language = shelter.content_language;

  if (Date.now() <= deadline) {
    const translations = await shelterTranslations(shelter, language);
    const previous = readTranslations(shelter.translations);
    if (!sameTranslations(translations, previous)) {
      const { error } = await supabase.from("shelter").update({ translations }).eq("id", true);
      if (error) {
        console.error("translate shelter failed", error.message);
      } else if (countNewEntries(translations, previous) > 0) {
        report.shelters = 1;
      } else {
        report.cleared += 1;
      }
    }
  }

  const items = await fetchAll((from, to) =>
    supabase.from("purchase_items").select("id, name, note, translations").gt("remaining", 0).order("id").range(from, to),
  );
  const itemCounts = await refresh(supabase, "purchase_items", items, (item) => itemTranslations(item, language), deadline);

  const projects = await fetchAll((from, to) =>
    supabase
      .from("projects")
      .select("id, title, description, progress_unit, photo_alt, translations")
      .eq("is_archived", false)
      .order("id")
      .range(from, to),
  );
  const projectCounts = await refresh(supabase, "projects", projects, (project) => projectTranslations(project, language), deadline);

  const pets = await fetchAll((from, to) =>
    supabase
      .from("pets")
      .select("id, name, health, description, photo_alt, translations")
      .in("status", PUBLIC_PET_STATUSES)
      .order("id")
      .range(from, to),
  );
  const petCounts = await refresh(supabase, "pets", pets, (pet) => petTranslations(pet, language), deadline);

  report.items = itemCounts.count;
  report.projects = projectCounts.count;
  report.pets = petCounts.count;
  report.cleared += itemCounts.cleared + projectCounts.cleared + petCounts.cleared;
  return report;
}

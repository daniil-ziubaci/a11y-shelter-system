import "server-only";

import { PUBLIC_PET_STATUSES } from "@/lib/petStatuses";
import { createAdminClient, type AdminClient } from "@/lib/supabase/admin";
import { fetchAll } from "@/lib/supabase/fetchAll";
import { petTranslations } from "@/lib/translatePet";
import { projectTranslations } from "@/lib/translateProject";
import { itemTranslations } from "@/lib/translatePurchaseItem";
import { shelterTranslations } from "@/lib/translateShelter";
import { readTranslations, sameTranslations } from "@/lib/translations";

type Languages = Map<string, string>;

async function translateShelters(
  supabase: AdminClient,
  deadline: number,
): Promise<{ count: number; languages: Languages }> {
  const languages: Languages = new Map();
  let count = 0;
  const { data: shelters } = await supabase
    .from("shelters")
    .select(
      "id, content_language, about, adoption_info, legal_info, contact_hours, photo_alt, city, donation_text, translations",
    );
  for (const shelter of shelters ?? []) {
    languages.set(shelter.id, shelter.content_language);
    if (Date.now() > deadline) {
      continue;
    }
    const translations = await shelterTranslations(
      shelter,
      shelter.content_language,
    );
    if (
      sameTranslations(translations, readTranslations(shelter.translations))
    ) {
      continue;
    }
    const { error } = await supabase
      .from("shelters")
      .update({ translations })
      .eq("id", shelter.id);
    if (error) {
      console.error("translate shelter failed", shelter.id, error.message);
    } else {
      count += 1;
    }
  }
  return { count, languages };
}

async function translatePets(
  supabase: AdminClient,
  languages: Languages,
  deadline: number,
): Promise<number> {
  let count = 0;
  const pets = await fetchAll((from, to) =>
    supabase
      .from("pets")
      .select(
        "id, shelter_id, name, health, description, photo_alt, translations",
      )
      .in("status", PUBLIC_PET_STATUSES)
      .order("id")
      .range(from, to),
  );
  for (const pet of pets) {
    if (Date.now() > deadline) {
      break;
    }
    const language = languages.get(pet.shelter_id);
    if (!language) {
      continue;
    }
    const translations = await petTranslations(pet, language);
    if (sameTranslations(translations, readTranslations(pet.translations))) {
      continue;
    }
    const { error } = await supabase
      .from("pets")
      .update({ translations })
      .eq("id", pet.id);
    if (error) {
      console.error("translate pet failed", pet.id, error.message);
    } else {
      count += 1;
    }
  }
  return count;
}

async function translateProjects(
  supabase: AdminClient,
  languages: Languages,
  deadline: number,
): Promise<number> {
  let count = 0;
  const projects = await fetchAll((from, to) =>
    supabase
      .from("projects")
      .select(
        "id, shelter_id, title, description, progress_unit, photo_alt, translations",
      )
      .eq("is_archived", false)
      .order("id")
      .range(from, to),
  );
  for (const project of projects) {
    if (Date.now() > deadline) {
      break;
    }
    const language = languages.get(project.shelter_id);
    if (!language) {
      continue;
    }
    const translations = await projectTranslations(project, language);
    if (
      sameTranslations(translations, readTranslations(project.translations))
    ) {
      continue;
    }
    const { error } = await supabase
      .from("projects")
      .update({ translations })
      .eq("id", project.id);
    if (error) {
      console.error("translate project failed", project.id, error.message);
    } else {
      count += 1;
    }
  }
  return count;
}

async function translateItems(
  supabase: AdminClient,
  languages: Languages,
  deadline: number,
): Promise<number> {
  let count = 0;
  const items = await fetchAll((from, to) =>
    supabase
      .from("purchase_items")
      .select("id, shelter_id, name, note, translations")
      .gt("remaining", 0)
      .order("id")
      .range(from, to),
  );
  for (const item of items) {
    if (Date.now() > deadline) {
      break;
    }
    const language = languages.get(item.shelter_id);
    if (!language) {
      continue;
    }
    const translations = await itemTranslations(item, language);
    if (sameTranslations(translations, readTranslations(item.translations))) {
      continue;
    }
    const { error } = await supabase
      .from("purchase_items")
      .update({ translations })
      .eq("id", item.id);
    if (error) {
      console.error("translate item failed", item.id, error.message);
    } else {
      count += 1;
    }
  }
  return count;
}

export type TranslateReport = {
  shelters: number;
  items: number;
  projects: number;
  pets: number;
};

export async function translateStale(
  deadline: number,
): Promise<TranslateReport> {
  const supabase = createAdminClient();
  const { count: shelters, languages } = await translateShelters(
    supabase,
    deadline,
  );
  const items = await translateItems(supabase, languages, deadline);
  const projects = await translateProjects(supabase, languages, deadline);
  const pets = await translatePets(supabase, languages, deadline);
  return { shelters, items, projects, pets };
}

import type { Database } from "@/lib/database";
import type { Locale } from "@/lib/i18n";
import { localizeShelter } from "@/lib/localizeShelter";
import { getPublicClient } from "@/lib/supabase";
import { pickShelterName } from "@/lib/transliterate";

export type ShelterRow = Database["public"]["Tables"]["shelter"]["Row"];

const TTL_MS = 60_000;
let cached: { row: ShelterRow | null; at: number } | undefined;

export async function loadShelterRow(): Promise<ShelterRow | null> {
  if (cached && Date.now() - cached.at < TTL_MS) {
    return cached.row;
  }
  const { data, error } = await getPublicClient().from("shelter").select("*").maybeSingle();
  if (error) {
    throw new Error("Не удалось загрузить приют из базы.");
  }
  cached = { row: data, at: Date.now() };
  return data;
}

export function localizeShelterRow(row: ShelterRow, locale: Locale) {
  const name = pickShelterName(row, locale);
  const aboutTitle = (locale === "ru" ? row.about_title : locale === "ro" ? row.about_title_ro : row.about_title_en) ?? name;
  return { ...localizeShelter(row, locale), name, aboutTitle };
}

export type Shelter = ReturnType<typeof localizeShelterRow>;

export async function getShelter(locale: Locale): Promise<Shelter | null> {
  const row = await loadShelterRow();
  return row ? localizeShelterRow(row, locale) : null;
}

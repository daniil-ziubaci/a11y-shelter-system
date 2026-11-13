import { getSupabase } from "./supabase";
import { pickShelterName } from "@/lib/transliterate";
import { localizeShelter } from "@/lib/localizeShelter";

export async function getShelter(slug: string, locale: string) {
  const { data, error } = await getSupabase()
    .from("shelters")
    .select("*")
    .eq("slug", slug)
    .single();
  if (error?.code === "PGRST116") return null;
  if (error) throw new Error("Не удалось загрузить приют из базы.");
  const name = pickShelterName(data, locale);
  const aboutTitle =
    (locale === "ru" ? data.about_title : locale === "ro" ? data.about_title_ro : data.about_title_en) ?? name;
  return { ...localizeShelter(data, locale), name, aboutTitle };
}
export type Shelter = NonNullable<Awaited<ReturnType<typeof getShelter>>>;

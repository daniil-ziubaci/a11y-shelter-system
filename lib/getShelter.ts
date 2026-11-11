import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { pickShelterName } from "@/lib/transliterate";
import { localizeShelter } from "@/lib/localizeShelter";
import { notFound } from "next/navigation";

export const getShelter = cache(async (slug: string, locale: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shelters")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error?.code === "PGRST116") {
    notFound();
  }
  if (error) {
    throw new Error("Не удалось загрузить приют из базы.");
  }
  const name = pickShelterName(data, locale);
  const aboutTitle =
    (locale === "ru"
      ? data.about_title
      : locale === "ro"
        ? data.about_title_ro
        : data.about_title_en) ?? name;
  return {
    ...localizeShelter(data, locale),
    name,
    aboutTitle,
  };
});

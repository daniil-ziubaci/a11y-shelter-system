import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { localizeName } from "@/lib/transliterate";
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
  return {
    ...localizeShelter(data, locale),
    name: localizeName(data.name, locale),
  };
});

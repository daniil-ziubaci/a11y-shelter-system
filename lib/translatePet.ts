import "server-only";

import { createClient } from "@/lib/supabase/server";
import { buildTranslations } from "@/lib/buildTranslations";
import { translateHealthPhrases } from "@/lib/healthPhrases";
import {
  readTranslations,
  sameTranslations,
  type Translations,
} from "@/lib/translations";
import type { Json } from "@/types/database";

const PET_CONTEXT: Record<string, string> = {
  ru: "Сайт приюта для бездомных животных. Текст описывает питомца: его здоровье, характер и фото.",
  ro: "Site-ul unui adăpost pentru animale fără stăpân. Textul descrie un animal: sănătatea, caracterul și fotografia lui.",
  en: "Website of a shelter for stray animals. The text describes a pet: its health, character and photo.",
};

type PetTexts = {
  name: string;
  health: string;
  description: string;
  photo_alt: string;
  translations: Json;
};

export function petTranslations(
  pet: PetTexts,
  sourceLanguage: string,
): Promise<Translations> {
  return buildTranslations({
    name: pet.name,
    sourceLanguage,
    texts: {
      health: pet.health,
      description: pet.description,
      photo_alt: pet.photo_alt,
    },
    previous: readTranslations(pet.translations),
    context: PET_CONTEXT,
    dictionary: (field, text, to) =>
      field === "health"
        ? translateHealthPhrases(text, sourceLanguage, to)
        : null,
  });
}

export async function translatePet(petId: string): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: pet } = await supabase
      .from("pets")
      .select("name, health, description, photo_alt, translations, shelter_id")
      .eq("id", petId)
      .maybeSingle();
    if (!pet) {
      return;
    }
    const { data: shelter } = await supabase
      .from("shelters")
      .select("content_language")
      .eq("id", pet.shelter_id)
      .maybeSingle();
    if (!shelter) {
      return;
    }
    const translations = await petTranslations(pet, shelter.content_language);
    if (sameTranslations(translations, readTranslations(pet.translations))) {
      return;
    }
    const { error } = await supabase
      .from("pets")
      .update({ translations })
      .eq("id", petId);
    if (error) {
      console.error("translatePet update failed", petId, error.message);
    }
  } catch (error) {
    console.error("translatePet failed", petId, error);
  }
}

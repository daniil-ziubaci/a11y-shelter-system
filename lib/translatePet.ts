import "server-only";

import { createClient } from "@/lib/supabase/server";
import { buildPetTranslations } from "@/lib/translatePetTexts";
import { readTranslations } from "@/lib/translations";

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
    const translations = await buildPetTranslations({
      name: pet.name,
      sourceLanguage: shelter.content_language,
      texts: {
        health: pet.health,
        description: pet.description,
        photo_alt: pet.photo_alt,
      },
      previous: readTranslations(pet.translations),
    });
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

import type { Database } from "@/types/database";
import type { Pet } from "@/types/pet";
import { localizeName } from "@/lib/transliterate";
import { monthsSince } from "@/lib/monthsSince";
import { textHash } from "@/lib/hashText";
import { pickTranslation, readTranslations } from "@/lib/translations";

type PetRow = Database["public"]["Tables"]["pets"]["Row"];

export function toPet(row: PetRow, locale: string): Pet {
  const translations = readTranslations(row.translations);
  const pick = (field: string, original: string) => {
    const text = pickTranslation(
      translations,
      field,
      locale,
      textHash(row.name, original),
    );
    return text === null
      ? { text: original, translated: false }
      : { text, translated: true };
  };
  const description = pick("description", row.description);
  const health = pick("health", row.health);
  const alt = pick("photo_alt", row.photo_alt);

  return {
    id: row.id,
    name: localizeName(row.name, locale),
    photo: {
      url: row.photo_url,
      alt: alt.text,
    },
    species: row.species as Pet["species"],
    sex: row.sex as Pet["sex"],
    ageInMonths: monthsSince(row.birth_date),
    isAgeApproximate: row.is_age_approximate,
    size: row.size,
    health: health.text,
    description: description.text,
    status: row.status as Pet["status"],
    needsTreatmentSince: row.needs_treatment_since,
    translated: {
      description: description.translated,
      health: health.translated,
      alt: alt.translated,
    },
  };
}

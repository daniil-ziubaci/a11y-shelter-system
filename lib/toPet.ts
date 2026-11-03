import type { Database } from "@/types/database";
import type { Pet } from "@/types/pet";
import { localizeName } from "@/lib/transliterate";
import { monthsSince } from "@/lib/monthsSince";

type PetRow = Database["public"]["Tables"]["pets"]["Row"];

export function toPet(row: PetRow, locale: string): Pet {
  return {
    id: row.id,
    name: localizeName(row.name, locale),
    photo: {
      url: row.photo_url,
      alt: row.photo_alt,
    },
    species: row.species as Pet["species"],
    sex: row.sex as Pet["sex"],
    ageInMonths: monthsSince(row.birth_date),
    isAgeApproximate: row.is_age_approximate,
    size: row.size,
    health: row.health,
    description: row.description,
    status: row.status as Pet["status"],
    needsTreatmentSince: row.needs_treatment_since,
  };
}

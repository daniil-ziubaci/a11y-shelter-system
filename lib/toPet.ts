import type { Database } from "@/types/database";
import type { Pet } from "@/types/pet";
import { monthsSince } from "@/lib/monthsSince";

type PetRow = Database["public"]["Tables"]["pets"]["Row"];

export function toPet(row: PetRow): Pet {
  return {
    name: row.name,
    photo: {
      url: row.photo_url,
      alt: row.photo_alt,
    },
    species: row.species as Pet["species"],
    sex: row.sex as Pet["sex"],
    ageInMonths: monthsSince(row.birth_date),
    isAgeApproximate: row.is_age_approximate,
    weight: row.weight,
    diet: row.diet,
    health: row.health,
    description: row.description,
    status: row.status as Pet["status"],
  };
}

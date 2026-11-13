import type { LifeStage } from "@/lib/lifeStage";

export type AnimalKey =
  | "kitten"
  | "catMale"
  | "catFemale"
  | "puppy"
  | "dogMale"
  | "dogFemale"
  | "other";

export function getAnimalKey(
  species: string,
  sex: string,
  lifeStage: LifeStage,
): AnimalKey {
  if (species === "кошка") {
    if (lifeStage === "young") {
      return "kitten";
    }
    if (sex === "мальчик") {
      return "catMale";
    }
    return "catFemale";
  }
  if (species === "собака") {
    if (lifeStage === "young") {
      return "puppy";
    }
    if (sex === "мальчик") {
      return "dogMale";
    }
    return "dogFemale";
  }
  return "other";
}

import { LifeStage } from "./lifeStage";

export function getAnimalWord(
  species: string,
  sex: string,
  lifeStage: LifeStage,
): string {
  if (species === "кошка") {
    if (lifeStage === "young") {
      return "котёнок";
    }
    if (sex === "мальчик") {
      return "кот";
    }
    return "кошка";
  }
  if (species === "собака") {
    if (lifeStage === "young") {
      return "щенок";
    }
    if (sex === "мальчик") {
      return "пёс";
    }
    return "собака";
  }
  return "животное";
}

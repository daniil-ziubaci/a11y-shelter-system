export type LifeStage = "young" | "adult" | "senior";

export function getLifeStage(ageInMonths: number): LifeStage {
  if (ageInMonths < 12) {
    return "young";
  }
  if (ageInMonths < 84) {
    return "adult";
  }
  return "senior";
}

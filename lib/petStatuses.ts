export const PET_STATUSES = [
  "ищет дом",
  "в процессе",
  "на лечении",
  "пристроен",
  "снят с учёта",
] as const;

export const PUBLIC_PET_STATUSES = ["ищет дом", "в процессе", "на лечении"];

export function getStatusRank(status: string): number {
  return PUBLIC_PET_STATUSES.indexOf(status);
}

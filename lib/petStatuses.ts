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

export const PET_STATUS_LABELS: Record<string, string> = {
  "ищет дом": "ищет дом",
  "в процессе": "в процессе усыновления",
  "на лечении": "лечение: пока нельзя забрать",
  пристроен: "пристроен",
  "снят с учёта": "снят с учёта",
};

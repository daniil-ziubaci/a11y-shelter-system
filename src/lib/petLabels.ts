const statusKeys: Record<string, string> = {
  "ищет дом": "looking",
  "в процессе": "pending",
  "на лечении": "treatment",
  "пристроен": "adopted",
  "снят с учёта": "removed",
};

export function getStatusKey(status: string): string | undefined {
  return statusKeys[status];
}

export function getSexKey(sex: string): "boy" | "girl" {
  return sex === "мальчик" ? "boy" : "girl";
}

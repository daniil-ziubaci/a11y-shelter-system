const categoryKeys: Record<string, string> = {
  корм: "food",
  лекарства: "medicine",
  расходники: "supplies",
  гигиена: "hygiene",
  амуниция: "gear",
  инвентарь: "tools",
  территория: "grounds",
  рабочим: "workers",
};

export function getCategoryKey(category: string): string | undefined {
  return categoryKeys[category];
}

export const NEED_CATEGORIES = Object.keys(categoryKeys);

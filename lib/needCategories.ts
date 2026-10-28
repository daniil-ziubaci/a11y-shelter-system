const categoryKeys: Record<string, string> = {
  корм: "food",
  лекарства: "medicine",
  гигиена: "hygiene",
  дезинфекция: "disinfection",
  расходники: "supplies",
};

export function getCategoryKey(category: string): string | undefined {
  return categoryKeys[category];
}

export const NEED_CATEGORIES = Object.keys(categoryKeys);

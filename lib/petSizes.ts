const sizeKeys: Record<string, string> = {
  мелкая: "small",
  средняя: "medium",
  крупная: "large",
};

export function getSizeKey(size: string): string | undefined {
  return sizeKeys[size];
}

export function getSizeFromKey(key: string): string | undefined {
  return Object.keys(sizeKeys).find((size) => sizeKeys[size] === key);
}

export const PET_SIZES = Object.keys(sizeKeys);

export const PET_SIZE_LABELS: Record<string, string> = {
  мелкая: "мелкий",
  средняя: "средний",
  крупная: "крупный",
};

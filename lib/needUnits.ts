const unitKeys: Record<string, string> = {
  кг: "kg",
  шт: "pcs",
  л: "l",
};

export function getUnitKey(unit: string): string | undefined {
  return unitKeys[unit];
}

export const NEED_UNITS = Object.keys(unitKeys);

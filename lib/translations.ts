import type { Json } from "@/types/database";

export type TranslationEntry = { text: string; hash: string };
export type Translations = Record<string, Record<string, TranslationEntry>>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isEntry(value: unknown): value is TranslationEntry {
  return (
    isRecord(value) &&
    typeof value.text === "string" &&
    typeof value.hash === "string"
  );
}

export function readTranslations(value: Json): Translations {
  const result: Translations = {};
  if (!isRecord(value)) {
    return result;
  }
  for (const [field, byLanguage] of Object.entries(value)) {
    if (!isRecord(byLanguage)) {
      continue;
    }
    for (const [language, entry] of Object.entries(byLanguage)) {
      if (isEntry(entry)) {
        result[field] = { ...result[field], [language]: entry };
      }
    }
  }
  return result;
}

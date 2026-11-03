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

export function pickTranslation(
  translations: Translations,
  field: string,
  language: string,
  hash: string,
): string | null {
  const entry = translations[field]?.[language];
  return entry && entry.hash === hash ? entry.text : null;
}

export function sameTranslations(a: Translations, b: Translations): boolean {
  const fields = Object.keys(a);
  if (fields.length !== Object.keys(b).length) {
    return false;
  }
  for (const field of fields) {
    const languagesA = a[field] ?? {};
    const languagesB = b[field] ?? {};
    const languages = Object.keys(languagesA);
    if (languages.length !== Object.keys(languagesB).length) {
      return false;
    }
    for (const language of languages) {
      const left = languagesA[language];
      const right = languagesB[language];
      if (
        !left ||
        !right ||
        left.text !== right.text ||
        left.hash !== right.hash
      ) {
        return false;
      }
    }
  }
  return true;
}

import { LOCALES } from "@/lib/i18n";
import { getRemainingCharacters, translateTexts } from "@/lib/deepl";
import { textHash } from "@/lib/hashText";
import type { Translations } from "@/lib/translations";
import { localizeName } from "@/lib/transliterate";

export type TranslationInput = {
  sourceLanguage: string;
  texts: Record<string, string>;
  previous: Translations;
  context: Record<string, string>;
  name?: string;
  dictionary?: (field: string, text: string, to: string) => string | null;
};

function keepFresh(
  input: TranslationInput,
  language: string,
  result: Translations,
): [string, string][] {
  const stale: [string, string][] = [];
  for (const [field, text] of Object.entries(input.texts)) {
    if (!/\p{L}/u.test(text)) {
      continue;
    }
    const old = input.previous[field]?.[language];
    if (old && old.hash === textHash(input.name ?? "", text)) {
      result[field] = { ...result[field], [language]: old };
    } else {
      stale.push([field, text]);
    }
  }
  return stale;
}

function applyDictionary(
  input: TranslationInput,
  language: string,
  pending: [string, string][],
  result: Translations,
): [string, string][] {
  const stale: [string, string][] = [];
  for (const [field, text] of pending) {
    const phrase = input.dictionary?.(field, text, language) ?? null;
    if (phrase === null) {
      stale.push([field, text]);
    } else {
      result[field] = {
        ...result[field],
        [language]: { text: phrase, hash: textHash(input.name ?? "", text) },
      };
    }
  }
  return stale;
}

export async function buildTranslations(
  input: TranslationInput,
): Promise<Translations> {
  const result: Translations = {};
  let remaining: number | null = null;

  for (const language of LOCALES) {
    if (language === input.sourceLanguage) {
      continue;
    }
    const pending = keepFresh(input, language, result);
    const stale = applyDictionary(input, language, pending, result);
    if (stale.length === 0) {
      continue;
    }
    const needed = stale.reduce((sum, [, text]) => sum + text.length, 0);
    remaining ??= await getRemainingCharacters();
    if (needed > remaining) {
      continue;
    }
    const name =
      input.name === undefined
        ? undefined
        : { from: input.name, to: localizeName(input.name, language) };
    const translated = await translateTexts(
      stale.map(([, text]) => text),
      input.sourceLanguage,
      language,
      name,
      input.context[input.sourceLanguage],
    );
    if (!translated) {
      continue;
    }
    remaining -= needed;
    for (const [index, [field, text]] of stale.entries()) {
      const value = translated[index];
      if (value !== undefined) {
        result[field] = {
          ...result[field],
          [language]: { text: value, hash: textHash(input.name ?? "", text) },
        };
      }
    }
  }
  return result;
}

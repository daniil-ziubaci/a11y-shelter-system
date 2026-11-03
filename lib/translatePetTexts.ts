import { routing } from "@/i18n/routing";
import { getRemainingCharacters, translateTexts } from "@/lib/deepl";
import { hashText } from "@/lib/hashText";
import type { Translations } from "@/lib/translations";
import { localizeName } from "@/lib/transliterate";

export function petTextHash(name: string, text: string): string {
  return hashText(`${name}\u0000${text}`);
}

const PET_CONTEXT: Record<string, string> = {
  ru: "Сайт приюта для бездомных животных. Текст описывает питомца: его здоровье, характер и фото.",
  ro: "Site-ul unui adăpost pentru animale fără stăpân. Textul descrie un animal: sănătatea, caracterul și fotografia lui.",
  en: "Website of a shelter for stray animals. The text describes a pet: its health, character and photo.",
};

export type PetTextsInput = {
  name: string;
  sourceLanguage: string;
  texts: Record<string, string>;
  previous: Translations;
};

function keepFresh(
  input: PetTextsInput,
  language: string,
  result: Translations,
): [string, string][] {
  const stale: [string, string][] = [];
  for (const [field, text] of Object.entries(input.texts)) {
    if (text === "") {
      continue;
    }
    const old = input.previous[field]?.[language];
    if (old && old.hash === petTextHash(input.name, text)) {
      result[field] = { ...result[field], [language]: old };
    } else {
      stale.push([field, text]);
    }
  }
  return stale;
}

export async function buildPetTranslations(
  input: PetTextsInput,
): Promise<Translations> {
  const result: Translations = {};
  let remaining: number | null = null;

  for (const language of routing.locales) {
    if (language === input.sourceLanguage) {
      continue;
    }
    const stale = keepFresh(input, language, result);
    if (stale.length === 0) {
      continue;
    }
    const needed = stale.reduce((sum, [, text]) => sum + text.length, 0);
    remaining ??= await getRemainingCharacters();
    if (needed > remaining) {
      continue;
    }
    const translated = await translateTexts(
      stale.map(([, text]) => text),
      input.sourceLanguage,
      language,
      { from: input.name, to: localizeName(input.name, language) },
      PET_CONTEXT[input.sourceLanguage],
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
          [language]: { text: value, hash: petTextHash(input.name, text) },
        };
      }
    }
  }
  return result;
}

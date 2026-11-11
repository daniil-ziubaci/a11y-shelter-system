import "server-only";

import { buildTranslations } from "@/lib/buildTranslations";
import { routing } from "@/i18n/routing";
import { translateCity } from "@/lib/cityNames";
import { textHash } from "@/lib/hashText";
import { localizeName } from "@/lib/transliterate";
import { readTranslations, type Translations } from "@/lib/translations";
import type { Json } from "@/types/database";

const SHELTER_CONTEXT: Record<string, string> = {
  ru: "Сайт приюта для бездомных животных. Тексты: раздел «О приюте» (рассказ о приюте, правила передачи животных, юридическая информация, часы связи) и обращение к дарителям о помощи и пожертвованиях.",
  ro: "Site-ul unui adăpost pentru animale fără stăpân. Texte din secțiunea «Despre adăpost» (povestea adăpostului, regulile de adopție, informații juridice, programul de contact) și un mesaj către donatori despre ajutor și donații.",
  en: "Website of a shelter for stray animals. Texts from the About page (the story of the shelter, adoption rules, legal information, contact hours) and a message to donors about help and donations.",
};

type ShelterTexts = {
  about: string | null;
  adoption_info: string | null;
  legal_info: string | null;
  contact_hours: string | null;
  photo_alt: string | null;
  donation_text: string | null;
  city: string | null;
  translations: Json;
};

function withCity(
  translations: Translations,
  city: string | null,
  sourceLanguage: string,
): Translations {
  if (!city) {
    return translations;
  }
  const hash = textHash("", city);
  const byLanguage: Translations[string] = {};
  for (const language of routing.locales) {
    if (language === sourceLanguage) {
      continue;
    }
    const text =
      translateCity(city, sourceLanguage, language) ??
      localizeName(city, language);
    byLanguage[language] = { text, hash };
  }
  return { ...translations, city: byLanguage };
}

export async function shelterTranslations(
  shelter: ShelterTexts,
  sourceLanguage: string,
): Promise<Translations> {
  const translations = await buildTranslations({
    sourceLanguage,
    texts: {
      about: shelter.about ?? "",
      adoption_info: shelter.adoption_info ?? "",
      legal_info: shelter.legal_info ?? "",
      contact_hours: shelter.contact_hours ?? "",
      photo_alt: shelter.photo_alt ?? "",
      donation_text: shelter.donation_text ?? "",
    },
    previous: readTranslations(shelter.translations),
    context: SHELTER_CONTEXT,
  });
  return withCity(translations, shelter.city, sourceLanguage);
}

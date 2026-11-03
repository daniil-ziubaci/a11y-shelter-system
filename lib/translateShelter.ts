import "server-only";

import { buildTranslations } from "@/lib/buildTranslations";
import { readTranslations, type Translations } from "@/lib/translations";
import type { Json } from "@/types/database";

const SHELTER_CONTEXT: Record<string, string> = {
  ru: "Сайт приюта для бездомных животных. Текст из раздела «О приюте»: рассказ о приюте, правила передачи животных, юридическая информация, часы связи.",
  ro: "Site-ul unui adăpost pentru animale fără stăpân. Text din secțiunea «Despre adăpost»: povestea adăpostului, regulile de adopție, informații juridice, programul de contact.",
  en: "Website of a shelter for stray animals. Text from the About page: the story of the shelter, adoption rules, legal information, contact hours.",
};

type ShelterTexts = {
  about: string | null;
  adoption_info: string | null;
  legal_info: string | null;
  contact_hours: string | null;
  photo_alt: string | null;
  city: string | null;
  translations: Json;
};

export function shelterTranslations(
  shelter: ShelterTexts,
  sourceLanguage: string,
): Promise<Translations> {
  return buildTranslations({
    sourceLanguage,
    texts: {
      about: shelter.about ?? "",
      adoption_info: shelter.adoption_info ?? "",
      legal_info: shelter.legal_info ?? "",
      contact_hours: shelter.contact_hours ?? "",
      photo_alt: shelter.photo_alt ?? "",
      city: shelter.city ?? "",
    },
    previous: readTranslations(shelter.translations),
    context: SHELTER_CONTEXT,
  });
}

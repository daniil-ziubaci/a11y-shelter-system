import { textHash } from "@/lib/hashText";
import { pickTranslation, readTranslations } from "@/lib/translations";
import type { Json } from "@/types/database";

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

export function localizeShelter<T extends ShelterTexts>(
  shelter: T,
  locale: string,
) {
  const translations = readTranslations(shelter.translations);
  const pick = (field: string, original: string | null) => {
    if (original === null) {
      return { text: null, translated: false };
    }
    const text = pickTranslation(
      translations,
      field,
      locale,
      textHash("", original),
    );
    return text === null
      ? { text: original, translated: false }
      : { text, translated: true };
  };

  const about = pick("about", shelter.about);
  const adoptionInfo = pick("adoption_info", shelter.adoption_info);
  const legalInfo = pick("legal_info", shelter.legal_info);
  const hours = pick("contact_hours", shelter.contact_hours);
  const alt = pick("photo_alt", shelter.photo_alt);
  const city = pick("city", shelter.city);
  const donationText = pick("donation_text", shelter.donation_text);

  return {
    ...shelter,
    about: about.text,
    adoption_info: adoptionInfo.text,
    legal_info: legalInfo.text,
    contact_hours: hours.text,
    photo_alt: alt.text,
    city: city.text,
    donation_text: donationText.text,
    translated: {
      about: about.translated,
      adoptionInfo: adoptionInfo.translated,
      legalInfo: legalInfo.translated,
      hours: hours.translated,
      alt: alt.translated,
      city: city.translated,
      donationText: donationText.translated,
    },
  };
}

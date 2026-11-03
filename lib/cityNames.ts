const CITIES: Record<string, Record<string, string>> = {
  кишинев: { ro: "Chișinău", en: "Chișinău" },
  бельцы: { ro: "Bălți", en: "Bălți" },
  дубоссары: { ro: "Dubăsari", en: "Dubăsari" },
  тирасполь: { ro: "Tiraspol", en: "Tiraspol" },
  бендеры: { ro: "Tighina", en: "Bender" },
  рыбница: { ro: "Rîbnița", en: "Rîbnița" },
  комрат: { ro: "Comrat", en: "Comrat" },
  кагул: { ro: "Cahul", en: "Cahul" },
  оргеев: { ro: "Orhei", en: "Orhei" },
  единцы: { ro: "Edineț", en: "Edineț" },
  сороки: { ro: "Soroca", en: "Soroca" },
  унгены: { ro: "Ungheni", en: "Ungheni" },
  страшены: { ro: "Strășeni", en: "Strășeni" },
  "чадыр-лунга": { ro: "Ciadîr-Lunga", en: "Ciadîr-Lunga" },
  дрокия: { ro: "Drochia", en: "Drochia" },
  яловены: { ro: "Ialoveni", en: "Ialoveni" },
  каушаны: { ro: "Căușeni", en: "Căușeni" },
  криуляны: { ro: "Criuleni", en: "Criuleni" },
  слободзея: { ro: "Slobozia", en: "Slobozia" },
  григориополь: { ro: "Grigoriopol", en: "Grigoriopol" },
  каменка: { ro: "Camenca", en: "Camenca" },
  флорешты: { ro: "Florești", en: "Florești" },
  хынчешты: { ro: "Hîncești", en: "Hîncești" },
  резина: { ro: "Rezina", en: "Rezina" },
  глодяны: { ro: "Glodeni", en: "Glodeni" },
  фалешты: { ro: "Fălești", en: "Fălești" },
};

export function translateCity(
  city: string,
  sourceLanguage: string,
  to: string,
): string | null {
  if (sourceLanguage !== "ru") {
    return null;
  }
  const key = city
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/^(г\.|город)\s*/, "")
    .trim();
  return CITIES[key]?.[to] ?? null;
}

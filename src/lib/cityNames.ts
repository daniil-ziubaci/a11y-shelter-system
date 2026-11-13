const CITIES: Record<string, Record<string, string>> = {
  кишинев: { ro: "Chișinău", en: "Chisinau" },
  бельцы: { ro: "Bălți", en: "Balti" },
  дубоссары: { ro: "Dubăsari", en: "Dubasari" },
  тирасполь: { ro: "Tiraspol", en: "Tiraspol" },
  бендеры: { ro: "Tighina", en: "Bender" },
  рыбница: { ro: "Rîbnița", en: "Ribnita" },
  комрат: { ro: "Comrat", en: "Comrat" },
  кагул: { ro: "Cahul", en: "Cahul" },
  оргеев: { ro: "Orhei", en: "Orhei" },
  единцы: { ro: "Edineț", en: "Edinet" },
  сороки: { ro: "Soroca", en: "Soroca" },
  унгены: { ro: "Ungheni", en: "Ungheni" },
  страшены: { ro: "Strășeni", en: "Straseni" },
  "чадыр-лунга": { ro: "Ceadîr-Lunga", en: "Ceadir-Lunga" },
  дрокия: { ro: "Drochia", en: "Drochia" },
  яловены: { ro: "Ialoveni", en: "Ialoveni" },
  каушаны: { ro: "Căușeni", en: "Causeni" },
  криуляны: { ro: "Criuleni", en: "Criuleni" },
  слободзея: { ro: "Slobozia", en: "Slobozia" },
  григориополь: { ro: "Grigoriopol", en: "Grigoriopol" },
  каменка: { ro: "Camenca", en: "Camenca" },
  флорешты: { ro: "Florești", en: "Floresti" },
  хынчешты: { ro: "Hîncești", en: "Hincesti" },
  резина: { ro: "Rezina", en: "Rezina" },
  глодяны: { ro: "Glodeni", en: "Glodeni" },
  фалешты: { ro: "Fălești", en: "Falesti" },
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

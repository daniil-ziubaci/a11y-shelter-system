const HEALTH_PHRASES: Record<string, Record<string, string>> = {
  здоров: { ro: "Sănătos", en: "Healthy" },
  здорова: { ro: "Sănătoasă", en: "Healthy" },
  привит: { ro: "Vaccinat", en: "Vaccinated" },
  привита: { ro: "Vaccinată", en: "Vaccinated" },
  вакцинирован: { ro: "Vaccinat", en: "Vaccinated" },
  вакцинирована: { ro: "Vaccinată", en: "Vaccinated" },
  стерилизован: { ro: "Sterilizat", en: "Sterilized" },
  стерилизована: { ro: "Sterilizată", en: "Sterilized" },
  кастрирован: { ro: "Castrat", en: "Neutered" },
  чипирован: { ro: "Microcipat", en: "Microchipped" },
  чипирована: { ro: "Microcipată", en: "Microchipped" },
  "обработан от паразитов": {
    ro: "Tratat împotriva paraziților",
    en: "Treated for parasites",
  },
  "обработана от паразитов": {
    ro: "Tratată împotriva paraziților",
    en: "Treated for parasites",
  },
};

export function translateHealthPhrases(
  text: string,
  from: string,
  to: string,
): string | null {
  if (from !== "ru") {
    return null;
  }
  const parts = text
    .toLowerCase()
    .replace(/[.!\s]+$/, "")
    .split(/\s*(?:,|;|\sи\s)\s*/)
    .map((part) => part.replace(/\s+/g, " ").trim());
  const words: string[] = [];
  for (const part of parts) {
    const word = HEALTH_PHRASES[part]?.[to];
    if (!word) {
      return null;
    }
    words.push(
      words.length === 0 ? word : word.charAt(0).toLowerCase() + word.slice(1),
    );
  }
  return words.join(", ");
}

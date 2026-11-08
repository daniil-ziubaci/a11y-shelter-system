const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "yo",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "kh",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "shch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

function isUpperCase(character: string | undefined): boolean {
  return character !== undefined && character !== character.toLowerCase();
}

function transliterate(text: string): string {
  const characters = Array.from(text);

  return characters
    .map((character, index) => {
      const latin: string | undefined =
        CYRILLIC_TO_LATIN[character.toLowerCase()];

      if (latin === undefined) {
        return character;
      }

      if (!isUpperCase(character)) {
        return latin;
      }

      const insideCapitals =
        isUpperCase(characters[index - 1]) ||
        isUpperCase(characters[index + 1]);

      return insideCapitals
        ? latin.toUpperCase()
        : latin.charAt(0).toUpperCase() + latin.slice(1);
    })
    .join("");
}

export function localizeName(name: string, locale: string): string {
  return locale === "ru" ? name : transliterate(name);
}

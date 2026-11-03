export const contentLanguages = ["ru", "ro", "en"] as const;

export type ContentLanguage = (typeof contentLanguages)[number];

export function toContentLanguage(value: string): ContentLanguage {
  return contentLanguages.find((language) => language === value) ?? "ru";
}

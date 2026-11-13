const contentLanguages = ["ru", "ro", "en"] as const;

export type ContentLanguage = (typeof contentLanguages)[number];

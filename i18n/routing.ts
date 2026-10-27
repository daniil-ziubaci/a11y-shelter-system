import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ru", "ro", "en"],
  defaultLocale: "ru",
  localeCookie: false,
  alternateLinks: false,
});

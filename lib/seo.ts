import { routing } from "@/i18n/routing";

export function buildAlternates(locale: string, path: string) {
  const languages: Record<string, string> = {};
  for (const code of routing.locales) {
    languages[code] = `/${code}${path}`;
  }
  languages["x-default"] = `/${routing.defaultLocale}${path}`;

  return {
    canonical: `/${locale}${path}`,
    languages,
  };
}

import type { AstroGlobal } from "astro";
import { isLocale, type Locale } from "@/lib/i18n";
import { getShelter, type Shelter } from "@/lib/shelter";

export const PUBLIC_CACHE = { maxAge: 60, swr: 60, tags: ["public"] };

export type PublicPage = { locale: Locale; shelter: Shelter };

export async function loadPublicPage(astro: AstroGlobal): Promise<PublicPage | Response> {
  const param = astro.params.locale;
  if (!isLocale(param)) {
    return astro.rewrite("/404");
  }
  const shelter = await getShelter(param);
  if (!shelter) {
    return astro.rewrite(`/${param}/404`);
  }
  astro.cache.set(PUBLIC_CACHE);
  return { locale: param, shelter };
}

export function contentLanguageOf(shelter: Shelter) {
  return shelter.content_language === "ro" || shelter.content_language === "en" ? shelter.content_language : "ru";
}

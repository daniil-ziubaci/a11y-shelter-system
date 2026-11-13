import type { Locale } from "@/lib/i18n";

export const LEGACY_SLUG = "live-life";

export const PUBLIC_SECTIONS = ["catalog", "needs", "projects", "about", "privacy"];

export function localePath(locale: Locale, path = ""): string {
  return `/${locale}${path}`;
}

export function switchLocalePath(url: URL, locale: Locale): string {
  const [, , ...rest] = url.pathname.split("/");
  const tail = rest.length > 0 ? `/${rest.join("/")}` : "";
  return `/${locale}${tail}${url.search}`;
}

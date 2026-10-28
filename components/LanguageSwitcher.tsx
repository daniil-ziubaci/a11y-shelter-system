"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";

const labels: Record<string, string> = {
  ru: "Русский",
  ro: "Română",
  en: "English",
};

export function LanguageSwitcher() {
  const t = useTranslations("Nav");
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <nav aria-label={t("language")}>
      <details className="relative">
        <summary
          aria-label={`${t("language")}: ${labels[locale]}`}
          className="flex cursor-pointer list-none items-center gap-1 rounded-md px-2 py-2 text-sm font-medium transition-colors duration-200 hover:bg-(--hover) [&::-webkit-details-marker]:hidden"
        >
          {labels[locale]}
          <span aria-hidden="true" className="text-xs">
            ▾
          </span>
        </summary>
        <ul className="absolute right-0 z-20 mt-1 min-w-40 rounded-lg border border-(--border) bg-(--surface) p-1 shadow-lg">
          {routing.locales.map((code) => (
            <li key={code}>
              <Link
                href={pathname}
                locale={code}
                lang={code}
                hrefLang={code}
                aria-current={locale === code ? "true" : undefined}
                className={`block px-3 py-2 ${locale === code ? "font-bold" : "underline"}`}
              >
                {labels[code]}
              </Link>
            </li>
          ))}
        </ul>
      </details>
    </nav>
  );
}

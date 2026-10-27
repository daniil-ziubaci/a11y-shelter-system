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
      <ul className="flex flex-wrap gap-4">
        {routing.locales.map((code) => (
          <li key={code}>
            <Link
              href={pathname}
              locale={code}
              lang={code}
              hrefLang={code}
              aria-current={locale === code ? "true" : undefined}
              className="underline inline-block py-2"
            >
              {labels[code]}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

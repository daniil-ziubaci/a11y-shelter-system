"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

const labels: Record<string, string> = {
  ru: "Русский",
  ro: "Română",
  en: "English",
};

const displayOrder = ["ro", "ru", "en"];

export function LanguageSwitcher({
  variant = "dropdown",
  onNavigate,
}: {
  variant?: "dropdown" | "list";
  onNavigate?: () => void;
}) {
  const t = useTranslations("Nav");
  const locale = useLocale();
  const pathname = usePathname();

  const searchParams = useSearchParams();
  const query = Object.fromEntries(searchParams.entries());

  const codes = [...routing.locales].sort(
    (a, b) => displayOrder.indexOf(a) - displayOrder.indexOf(b),
  );

  if (variant === "list") {
    return (
      <nav aria-label={t("language")}>
        <ul className="grid grid-cols-3 gap-2">
          {codes.map((code) => (
            <li key={code}>
              <Link
                href={{ pathname, query }}
                locale={code}
                lang={code}
                hrefLang={code}
                onClick={onNavigate}
                aria-current={locale === code ? "true" : undefined}
                className={`flex min-h-12 items-center justify-center rounded-md border px-3 font-medium transition-colors duration-200 ${locale === code ? "border-(--accent) bg-(--accent) font-bold text-(--accent-contrast)" : "border-(--border) hover:bg-(--hover) hover:text-(--accent)"}`}
              >
                {labels[code]}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    );
  }

  return (
    <nav aria-label={t("language")}>
      <details className="relative">
        <summary
          aria-label={`${t("language")}: ${labels[locale]}`}
          className="flex min-h-11 cursor-pointer list-none items-center gap-1 rounded-md px-2 py-2 text-sm md:text-base font-medium transition-colors duration-200 hover:bg-(--hover) hover:text-(--accent) [&::-webkit-details-marker]:hidden"
        >
          {labels[locale]}
          <span aria-hidden="true" className="text-xs">
            ▾
          </span>
        </summary>
        <ul className="absolute right-0 z-20 mt-1 min-w-40 rounded-lg border border-(--border) bg-(--surface) p-1 shadow-lg">
          {codes.map((code) => (
            <li key={code}>
              <Link
                href={{ pathname, query }}
                locale={code}
                lang={code}
                hrefLang={code}
                aria-current={locale === code ? "true" : undefined}
                className={`flex min-h-11 items-center px-3 py-2 transition-colors duration-200 hover:text-(--accent) ${locale === code ? "font-bold text-(--accent)" : ""}`}
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

"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export function ShelterNav({ slug }: { slug: string }) {
  const pathname = usePathname();
  const t = useTranslations("Nav");
  const links = [
    { href: `/shelter/${slug}/catalog`, label: t("catalog") },
    { href: `/shelter/${slug}/needs`, label: t("needs") },
    { href: `/shelter/${slug}/treatment`, label: t("treatment") },
    { href: `/shelter/${slug}/about`, label: t("about") },
  ];

  return (
    <nav aria-label={t("label")}>
      <ul className="flex flex-wrap gap-4">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              className="underline inline-block py-2"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

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
      <ul className="flex flex-wrap gap-1">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              className="inline-block rounded-md px-2 py-2 text-sm font-medium md:text-base transition-colors duration-200 hover:bg-(--hover) motion-reduce:transition-none aria-[current=page]:bg-(--hover) aria-[current=page]:font-semibold"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

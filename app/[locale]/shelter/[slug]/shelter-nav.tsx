"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

export function ShelterNav({ slug }: { slug: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isTreatment = searchParams.get("mode") === "treatment";
  const t = useTranslations("Nav");
  const catalogPath = `/shelter/${slug}/catalog`;
  const links = [
    {
      href: catalogPath,
      label: t("catalog"),
      current: pathname === catalogPath && !isTreatment,
    },
    {
      href: `/shelter/${slug}/needs`,
      label: t("needs"),
      current: pathname === `/shelter/${slug}/needs`,
    },
    {
      href: `${catalogPath}?mode=treatment`,
      label: t("treatment"),
      current: pathname === catalogPath && isTreatment,
    },
    {
      href: `/shelter/${slug}/about`,
      label: t("about"),
      current: pathname === `/shelter/${slug}/about`,
    },
  ];

  return (
    <nav aria-label={t("label")}>
      <ul className="flex flex-wrap gap-1">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={link.current ? "page" : undefined}
              className="inline-block rounded-md px-2 py-2 text-sm font-medium md:text-base transition-colors duration-200 hover:bg-(--hover) hover:text-(--accent) motion-reduce:transition-none aria-[current=page]:bg-(--hover) aria-[current=page]:text-(--accent) aria-[current=page]:font-semibold"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

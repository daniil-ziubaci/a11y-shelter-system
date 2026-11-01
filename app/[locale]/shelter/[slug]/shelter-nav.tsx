"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

export function ShelterNav({ slug }: { slug: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isTreatment = searchParams.get("mode") === "treatment";
  const t = useTranslations("Nav");

  const [open, setOpen] = useState(false);
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

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
      href: `/shelter/${slug}/projects`,
      label: t("projects"),
      current: pathname === `/shelter/${slug}/projects`,
    },
    {
      href: `/shelter/${slug}/about`,
      label: t("about"),
      current: pathname === `/shelter/${slug}/about`,
    },
  ];

  return (
    <nav aria-label={t("label")}>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen(!open)}
        className="inline-flex min-h-11 items-center rounded-md border-2 border-(--accent) px-4 font-semibold text-(--accent) hover:bg-(--hover) lg:hidden"
      >
        {t("menu")}
      </button>
      <ul
        id={menuId}
        className={`${open ? "flex" : "hidden"} absolute inset-x-0 top-full max-h-[calc(100dvh-4rem)] flex-col gap-1 overflow-y-auto border-t border-(--border) bg-(--background) px-4 py-3 shadow-md lg:max-h-none lg:overflow-visible lg:static lg:flex lg:flex-row lg:flex-wrap lg:gap-1 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none`}
      >
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              onClick={() => setOpen(false)}
              aria-current={link.current ? "page" : undefined}
              className="flex min-h-12 items-center rounded-md px-4 font-medium max-lg:font-semibold transition-colors duration-200 hover:bg-(--hover) hover:text-(--accent) motion-reduce:transition-none aria-[current=page]:bg-(--hover) aria-[current=page]:text-(--accent) aria-[current=page]:font-semibold lg:inline-flex lg:min-h-0 lg:rounded-md lg:px-2 lg:py-2 lg:text-base"
            >
              {link.label}
            </Link>
          </li>
        ))}

        <li className="mt-2 border-t border-(--border) pt-3 lg:hidden">
          <a
            href="#footer-contact-heading"
            onClick={() => setOpen(false)}
            className="flex min-h-12 w-full items-center justify-center rounded-full bg-(--accent) px-5 font-semibold text-(--accent-contrast) hover:shadow-md"
          >
            {t("contact")}
          </a>
        </li>
      </ul>
    </nav>
  );
}

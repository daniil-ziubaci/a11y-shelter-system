"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function ShelterNav({ slug }: { slug: string }) {
  const pathname = usePathname();
  const links = [
    { href: `/shelter/${slug}/catalog`, label: "Животные ищут дом" },
    { href: `/shelter/${slug}/treatment`, label: "Нужна помощь с лечением" },
    { href: `/shelter/${slug}/about`, label: "О приюте" },
  ];

  return (
    <nav aria-label="Основная навигация">
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

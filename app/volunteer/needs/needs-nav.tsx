"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/volunteer/needs", label: "Приёмка товара" },
  { href: "/volunteer/needs/open", label: "Нужно купить" },
  { href: "/volunteer/needs/stock", label: "Запас" },
  { href: "/volunteer/needs/closed", label: "Закрытые" },
];

export function NeedsNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <nav aria-label="Разделы плана закупок">
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
      <Link href="/volunteer/needs/new" className="underline inline-block py-2">
        Добавить позицию
      </Link>
    </div>
  );
}

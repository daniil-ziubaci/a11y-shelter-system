"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/volunteer/needs", label: "Приёмка" },
  { href: "/volunteer/needs/open", label: "Нужно купить" },
  { href: "/volunteer/needs/stock", label: "Запас" },
  { href: "/volunteer/needs/closed", label: "Закрытые" },
];

const pill =
  "inline-flex min-h-10 items-center rounded-full border border-(--border-strong) bg-(--surface) px-4 aria-[current=page]:border-transparent aria-[current=page]:bg-(--accent) aria-[current=page]:text-white";

export function NeedsNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-3">
      <nav aria-label="Разделы плана закупок">
        <ul className="flex flex-wrap gap-2 sm:justify-center">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={pathname === link.href ? "page" : undefined}
                className={pill}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <Link
        href="/volunteer/needs/new"
        className="flex h-10 items-center justify-center rounded-lg border border-(--border-strong) bg-(--surface) px-4 font-medium sm:self-center"
      >
        Добавить позицию
      </Link>
    </div>
  );
}

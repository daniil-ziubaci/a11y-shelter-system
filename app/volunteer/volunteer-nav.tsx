"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function VolunteerNav() {
  const pathname = usePathname();
  if (pathname.startsWith("/volunteer/2fa")) {
    return null;
  }
  const links = [
    {
      href: "/volunteer/needs",
      label: "Закупки",
      inSection: pathname.startsWith("/volunteer/needs"),
    },
    {
      href: "/volunteer",
      label: "Животные",
      inSection:
        pathname === "/volunteer" || pathname.startsWith("/volunteer/pets"),
    },
    {
      href: "/volunteer/projects",
      label: "Проекты",
      inSection: pathname.startsWith("/volunteer/projects"),
    },
  ];

  return (
    <nav aria-label="Разделы панели волонтёра">
      <ul className="grid grid-cols-3 gap-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={
                pathname === link.href
                  ? "page"
                  : link.inSection
                    ? "true"
                    : undefined
              }
              className={`flex min-h-10 items-center justify-center rounded-lg border px-2 text-center font-medium ${
                link.inSection
                  ? "border-transparent bg-(--accent) text-white"
                  : "border-(--border-strong) bg-(--surface)"
              }`}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

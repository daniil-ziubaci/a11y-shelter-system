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
      href: "/volunteer",
      label: "Животные",
      inSection:
        pathname === "/volunteer" || pathname.startsWith("/volunteer/pets"),
    },
    {
      href: "/volunteer/needs",
      label: "План закупок",
      inSection: pathname.startsWith("/volunteer/needs"),
    },
    {
      href: "/volunteer/projects",
      label: "Проекты",
      inSection: pathname.startsWith("/volunteer/projects"),
    },
  ];

  return (
    <nav aria-label="Разделы панели волонтёра">
      <ul className="flex flex-wrap gap-4">
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

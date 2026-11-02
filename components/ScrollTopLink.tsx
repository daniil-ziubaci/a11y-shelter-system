"use client";

import { Link, usePathname } from "@/i18n/navigation";
import type { ComponentProps } from "react";

type Props = Omit<ComponentProps<typeof Link>, "href"> & { href: string };

export function ScrollTopLink({ href, onClick, ...props }: Props) {
  const pathname = usePathname();

  return (
    <Link
      href={href}
      onClick={(event) => {
        onClick?.(event);
        if (pathname === href.split("?")[0]) {
          window.scrollTo({ top: 0 });
        }
      }}
      {...props}
    />
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const INNER = /^\/volunteer\/(pets|needs|projects)\/(new|[^/]+\/edit)$/;

export function BackLink() {
  const pathname = usePathname();
  const router = useRouter();
  const match = INNER.exec(pathname);
  if (!match) {
    return null;
  }
  const parent = match[1] === "pets" ? "/volunteer" : `/volunteer/${match[1]}`;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-4">
      <Link
        href={parent}
        onClick={(event) => {
          if (window.history.length > 1) {
            event.preventDefault();
            router.back();
          }
        }}
        className="group flex h-10 w-full items-center gap-3 sm:mx-auto sm:w-[calc(50%-0.5rem)] text-lg font-medium tracking-wide text-(--accent)"
      >
        <span
          aria-hidden="true"
          className="text-2xl leading-none transition-transform motion-safe:group-hover:-translate-x-2 motion-safe:group-focus-visible:-translate-x-2"
        >
          ←
        </span>
        Назад
      </Link>
    </div>
  );
}

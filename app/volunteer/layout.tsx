import type { ReactNode } from "react";
import Link from "next/link";
import { logout } from "@/app/volunteer/actions";
import { VolunteerNav } from "@/app/volunteer/volunteer-nav";
import { BackLink } from "@/app/volunteer/back-link";
import { createClient } from "@/lib/supabase/server";

export default async function VolunteerLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const showNav = data?.claims?.aal === "aal2";
  const email = data?.claims?.email;
  const account = typeof email === "string" ? email.split("@")[0] : "";
  const { data: membership } = showNav
    ? await supabase
        .from("shelter_members")
        .select("shelters(name, slug)")
        .limit(1)
        .maybeSingle()
    : { data: null };
  const shelterName = membership?.shelters?.name;
  const shelterSlug = membership?.shelters?.slug;

  return (
    <>
      <a
        href="#volunteer-content"
        className="sr-only focus:not-sr-only focus:inline-block focus:p-2 focus:underline"
      >
        Перейти к содержимому
      </a>
      <header className="sticky top-0 z-30 w-full bg-(--background) shadow-md">
        <div className="mx-auto flex max-w-5xl flex-col gap-1 px-4 py-1.5">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          {shelterName &&
            (shelterSlug ? (
              <Link
                href={`/ru/shelter/${shelterSlug}`}
                aria-label={`${shelterName}: страница приюта на сайте`}
                className="order-1 min-w-0 truncate text-base font-bold hover:underline"
              >
                {shelterName}
              </Link>
            ) : (
              <p className="order-1 min-w-0 truncate text-base font-bold">
                {shelterName}
              </p>
            ))}
          <details className="relative order-2 ml-auto">
            <summary className="flex h-10 cursor-pointer list-none items-center gap-1 px-2 text-(--muted) [&::-webkit-details-marker]:hidden">
              <span>Аккаунт</span>
              <span aria-hidden="true">▾</span>
            </summary>
            <div className="absolute right-0 top-full mt-1 min-w-48 rounded-xl border border-(--border) bg-(--surface) p-2 shadow-md">
              {account && (
                <p className="truncate px-2 py-1 text-sm text-(--muted)">
                  {account}
                </p>
              )}
              <form action={logout}>
                <button
                  type="submit"
                  className="h-10 w-full cursor-pointer rounded-lg px-2 text-left font-medium hover:bg-(--hover)"
                >
                  Выйти
                </button>
              </form>
            </div>
          </details>
        </div>
        {showNav && <VolunteerNav />}
      </div>
      </header>
      {showNav && <BackLink />}
      <div id="volunteer-content" tabIndex={-1}>
        {children}
      </div>
    </>
  );
}

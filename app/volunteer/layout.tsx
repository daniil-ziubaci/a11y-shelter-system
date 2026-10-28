import type { ReactNode } from "react";
import { logout } from "@/app/volunteer/actions";
import { VolunteerNav } from "@/app/volunteer/volunteer-nav";
import { createClient } from "@/lib/supabase/server";

export default async function VolunteerLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const showNav = data?.claims?.aal === "aal2";

  return (
    <>
      <a
        href="#volunteer-content"
        className="sr-only focus:not-sr-only focus:inline-block focus:p-2 focus:underline"
      >
        Перейти к содержимому
      </a>
      <header className="flex flex-wrap items-center justify-between gap-4 p-4 max-w-5xl mx-auto">
        {showNav ? <VolunteerNav /> : <span />}
        <form action={logout}>
          <button type="submit">Выйти</button>
        </form>
      </header>
      <div id="volunteer-content" tabIndex={-1}>
        {children}
      </div>
    </>
  );
}

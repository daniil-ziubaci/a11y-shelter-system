import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getNeedItems } from "@/lib/getNeedItems";
import { NeedsNav } from "@/app/volunteer/needs/needs-nav";
import { NeedItems } from "@/app/volunteer/needs/need-items";

type Kind = "open" | "stock" | "closed";

const filters: Record<Kind, (remaining: number) => boolean> = {
  open: (remaining) => remaining > 0,
  stock: (remaining) => remaining < 0,
  closed: (remaining) => remaining === 0,
};

export async function NeedSectionPage({
  kind,
  heading,
  emptyText,
  archived = false,
}: {
  kind: Kind;
  heading: string;
  emptyText: string;
  archived?: boolean;
}) {
  const supabase = await createClient();
  const { data: membership } = await supabase
    .from("shelter_members")
    .select("shelter_id")
    .limit(1)
    .maybeSingle();

  if (!membership) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 pb-6 pt-4">
        <h1 className="text-3xl font-bold sm:text-center">{heading}</h1>
        <p>Вы пока не состоите ни в одном приюте. Обратитесь к координатору.</p>
      </main>
    );
  }

  const { items, error } = await getNeedItems(membership.shelter_id, archived);
  const shown = items.filter((item) => filters[kind](item.remaining));

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 pb-6 pt-4">
      <h1 className="text-3xl font-bold sm:text-center">{heading}</h1>
      <NeedsNav />
      {error ? (
        <p role="alert">Не удалось загрузить план закупок.</p>
      ) : (
        <NeedItems
          items={shown}
          emptyText={emptyText}
          kind={kind}
          archived={archived}
        />
      )}
      {kind === "closed" && (
        <Link
          href={archived ? "/volunteer/needs/closed" : "/volunteer/needs/closed?archived=1"}
          className="flex h-10 items-center justify-center text-(--muted) underline sm:self-center"
        >
          {archived ? "К закрытым" : "Показать убранные"}
        </Link>
      )}
    </main>
  );
}

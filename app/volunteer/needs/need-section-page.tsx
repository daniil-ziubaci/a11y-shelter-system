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
}: {
  kind: Kind;
  heading: string;
  emptyText: string;
}) {
  const supabase = await createClient();
  const { data: membership } = await supabase
    .from("shelter_members")
    .select("shelter_id, shelters(name)")
    .limit(1)
    .maybeSingle();

  if (!membership) {
    return (
      <main className="w-full flex flex-col gap-6 p-4 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold">{heading}</h1>
        <p>Вы пока не состоите ни в одном приюте. Обратитесь к координатору.</p>
      </main>
    );
  }

  const { items, error } = await getNeedItems(membership.shelter_id);
  const shown = items.filter((item) => filters[kind](item.remaining));

  return (
    <main className="w-full flex flex-col gap-6 p-4 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold">{heading}</h1>
      <NeedsNav />
      <p>Приют: {membership.shelters?.name}</p>
      {error ? (
        <p role="alert">Не удалось загрузить план закупок.</p>
      ) : (
        <NeedItems items={shown} emptyText={emptyText} />
      )}
    </main>
  );
}

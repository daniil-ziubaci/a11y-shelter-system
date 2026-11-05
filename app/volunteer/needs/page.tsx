import { createClient } from "@/lib/supabase/server";
import { getNeedItems } from "@/lib/getNeedItems";
import { getLatestPurchase } from "@/lib/getLatestPurchase";
import { NeedsNav } from "@/app/volunteer/needs/needs-nav";
import { ReceiveForm } from "@/app/volunteer/needs/receive/receive-form";
import { UndoForm } from "@/app/volunteer/needs/undo/undo-form";

export const metadata = {
  title: "План закупок: приёмка товара",
  robots: { index: false },
};

export default async function VolunteerNeedsPage() {
  const supabase = await createClient();
  const { data: membership } = await supabase
    .from("shelter_members")
    .select("shelter_id")
    .limit(1)
    .maybeSingle();

  if (!membership) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 pb-6 pt-4">
        <h1 className="text-3xl font-bold sm:text-center">План закупок: приёмка товара</h1>
        <p>Вы пока не состоите ни в одном приюте. Обратитесь к координатору.</p>
      </main>
    );
  }

  const { items, error } = await getNeedItems(membership.shelter_id);
  const latest = await getLatestPurchase(membership.shelter_id);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 pb-6 pt-4">
      <h1 className="text-3xl font-bold sm:text-center">План закупок: приёмка товара</h1>
      <NeedsNav />
      {error ? (
        <p role="alert">Не удалось загрузить план закупок.</p>
      ) : (
        <>
          <ReceiveForm items={items} />
          <div className="sm:mx-auto sm:w-[calc(50%-0.5rem)]">
            <UndoForm latest={latest} />
          </div>
        </>
      )}
    </main>
  );
}

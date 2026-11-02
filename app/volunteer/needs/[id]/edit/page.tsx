import { EditNeedForm } from "@/app/volunteer/needs/[id]/edit/edit-need-form";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Редактирование позиции плана закупок",
  robots: { index: false },
};

export default async function EditNeedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("shelter_members")
    .select("shelter_id")
    .limit(1)
    .maybeSingle();

  if (!membership) {
    return <p role="alert">Вы не состоите ни в одном приюте.</p>;
  }

  const { data: item, error } = await supabase
    .from("purchase_items")
    .select("id, name, category, is_urgent")
    .eq("id", id)
    .eq("shelter_id", membership.shelter_id)
    .maybeSingle();

  if (error) {
    return <p role="alert">Не удалось загрузить позицию.</p>;
  }

  if (!item) {
    return <p role="alert">Позиция не найдена.</p>;
  }

  return (
    <main className="w-full flex flex-col gap-6 p-4 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold">Редактирование: {item.name}</h1>
      <EditNeedForm item={item} />
    </main>
  );
}

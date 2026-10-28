import { createClient } from "@/lib/supabase/server";
import { formatRemaining } from "@/lib/formatRemaining";
import { ReceiveForm } from "@/app/volunteer/needs/receive/receive-form";
import { getLatestPurchase } from "@/lib/getLatestPurchase";
import { UndoForm } from "@/app/volunteer/needs/undo/undo-form";
import Link from "next/link";

type NeedItem = {
  id: string;
  name: string;
  unit: string;
  remaining: number;
};

function NeedSection({
  title,
  emptyText,
  items,
}: {
  title: string;
  emptyText: string;
  items: NeedItem[];
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-xl font-bold">{title}</h2>
      {items.length === 0 ? (
        <p>{emptyText}</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              {item.name}: {formatRemaining(item.remaining, item.unit)}{" "}
              <Link
                href={`/volunteer/needs/${item.id}/edit`}
                aria-label={`Редактировать: ${item.name}`}
              >
                Редактировать
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export async function NeedList({ shelterId }: { shelterId: string }) {
  const supabase = await createClient();
  const { data: items, error } = await supabase
    .from("purchase_items")
    .select("id, name, unit, remaining")
    .eq("shelter_id", shelterId)
    .order("created_at");

  if (error) {
    return <p role="alert">Не удалось загрузить план закупок.</p>;
  }
  if (!items || items.length === 0) {
    return <p>Позиций пока нет.</p>;
  }

  const open = items.filter((item) => item.remaining > 0);
  const stock = items.filter((item) => item.remaining < 0);
  const closed = items.filter((item) => item.remaining === 0);
  const latest = await getLatestPurchase(shelterId);

  return (
    <>
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">Приёмка товара</h2>
        <ReceiveForm items={items} />
        <UndoForm latest={latest} />
      </section>
      <NeedSection
        title="Нужно купить"
        emptyText="Открытых нужд нет."
        items={open}
      />
      <NeedSection title="Запас" emptyText="Запаса нет." items={stock} />
      <NeedSection
        title="Закрытые"
        emptyText="Закрытых позиций нет."
        items={closed}
      />
    </>
  );
}

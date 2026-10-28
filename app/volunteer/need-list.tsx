import { createClient } from "@/lib/supabase/server";
import { formatRemaining } from "@/lib/formatRemaining";

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
  const closed = items.filter((item) => item.remaining <= 0);

  return (
    <>
      <h3 className="text-lg font-bold">Нужно купить</h3>
      {open.length === 0 ? (
        <p>Открытых нужд нет.</p>
      ) : (
        <ul>
          {open.map((item) => (
            <li key={item.id}>
              {item.name}: {formatRemaining(item.remaining, item.unit)}
            </li>
          ))}
        </ul>
      )}
      <h3 className="text-lg font-bold">Запас и закрытые</h3>
      {closed.length === 0 ? (
        <p>Запаса и закрытых позиций нет.</p>
      ) : (
        <ul>
          {closed.map((item) => (
            <li key={item.id}>
              {item.name}: {formatRemaining(item.remaining, item.unit)}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

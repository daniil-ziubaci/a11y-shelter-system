import Link from "next/link";
import { formatRemaining } from "@/lib/formatRemaining";

type NeedItem = {
  id: string;
  name: string;
  unit: string;
  remaining: number;
};

export function NeedItems({
  items,
  emptyText,
}: {
  items: NeedItem[];
  emptyText: string;
}) {
  if (items.length === 0) {
    return <p>{emptyText}</p>;
  }
  return (
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
  );
}

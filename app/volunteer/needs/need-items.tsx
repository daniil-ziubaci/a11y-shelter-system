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
  kind,
}: {
  items: NeedItem[];
  emptyText: string;
  kind: "open" | "stock" | "closed";
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
            href={`/volunteer/needs/${item.id}/edit?from=${kind}`}
            aria-label={`Редактировать: ${item.name}`}
          >
            Редактировать
          </Link>
        </li>
      ))}
    </ul>
  );
}

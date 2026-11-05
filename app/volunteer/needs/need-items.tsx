import Link from "next/link";
import { formatRemaining } from "@/lib/formatRemaining";
import { ConsumptionForm } from "@/app/volunteer/needs/consumption-form";
import { setNeedArchived } from "@/app/volunteer/archive/actions";

type NeedItem = {
  id: string;
  name: string;
  unit: string;
  remaining: number;
  is_urgent: boolean;
};

export function NeedItems({
  items,
  emptyText,
  kind,
  archived = false,
}: {
  items: NeedItem[];
  emptyText: string;
  kind: "open" | "stock" | "closed";
  archived?: boolean;
}) {
  if (items.length === 0) {
    return <p className="text-(--muted)">{emptyText}</p>;
  }
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {items.map((item) => {
        const urgent = kind === "open" && item.is_urgent;
        return (
          <li
            key={item.id}
            className={`relative flex flex-col gap-3 rounded-xl border bg-(--surface) p-3 shadow-[0_2px_10px_rgba(90,50,20,0.22)] ${
              urgent
                ? "border-[color-mix(in_srgb,var(--danger)_45%,transparent)]"
                : "border-(--border)"
            }`}
          >
            <div className={`flex flex-col ${urgent ? "pr-24" : ""}`}>
              {urgent && (
                <span className="absolute right-3 top-3 rounded-full bg-(--danger-soft) px-2 py-0.5 text-sm font-semibold text-(--danger)">
                  <span aria-hidden="true">🔥 </span>
                  Срочно
                </span>
              )}
              <span className="text-lg font-bold wrap-break-word">
                {item.name}
              </span>
              <span className="text-(--muted)">
                {formatRemaining(item.remaining, item.unit)}
              </span>
            </div>
            <div className="mt-auto flex flex-col gap-2">
              <ConsumptionForm
                itemId={item.id}
                itemName={item.name}
                closed={kind === "closed"}
              />
              <Link
                href={`/volunteer/needs/${item.id}/edit?from=${kind}`}
                aria-label={`Редактировать: ${item.name}`}
                className="flex h-10 w-full items-center justify-center rounded-lg border border-(--border-strong) bg-(--surface) px-3 text-[15px] font-medium"
              >
                Редактировать
              </Link>
              {kind === "closed" && (
                <form action={setNeedArchived}>
                  <input type="hidden" name="id" value={item.id} />
                  <input
                    type="hidden"
                    name="archived"
                    value={archived ? "0" : "1"}
                  />
                  <button
                    type="submit"
                    aria-label={`${archived ? "Вернуть в список" : "Убрать из списка"}: ${item.name}`}
                    className="h-10 w-full cursor-pointer rounded-lg px-3 text-[15px] font-medium text-(--muted) underline"
                  >
                    {archived ? "Вернуть в список" : "Убрать из списка"}
                  </button>
                </form>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

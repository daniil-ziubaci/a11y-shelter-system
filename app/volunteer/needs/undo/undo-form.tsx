"use client";

import { useActionState } from "react";
import { undoPurchase } from "@/app/volunteer/needs/undo/actions";

export type LatestPurchase = {
  id: string;
  label: string;
};

export function UndoForm({ latest }: { latest: LatestPurchase | null }) {
  const [state, formAction, isPending] = useActionState(
    undoPurchase,
    undefined,
  );

  return (
    <div className="flex flex-col gap-2">
      {latest ? (
        <form
          action={formAction}
          className="flex flex-col gap-2 rounded-2xl border border-(--border) bg-(--surface) p-4 shadow-md"
        >
          <input type="hidden" name="logId" value={latest.id} />
          <h2 className="font-bold">Последняя запись</h2>
          <p className="wrap-break-word">{latest.label}</p>
          <p className="text-sm text-(--muted)">
            Ошиблись? Запись можно отменить в течение 10 минут.
          </p>
          <button
            type="submit"
            disabled={isPending}
            aria-label={`Отменить запись: ${latest.label}`}
            className="mt-1 h-10 w-full cursor-pointer rounded-lg border-2 border-(--danger) bg-(--danger-soft) px-4 font-semibold text-(--danger) disabled:cursor-wait disabled:opacity-60"
          >
            {isPending ? "Отменяем…" : "Отменить запись"}
          </button>
        </form>
      ) : (
        <p className="text-center text-(--muted)">Нечего отменять.</p>
      )}
      <p role="status" className="text-center font-medium empty:hidden">
        {state?.message ?? ""}
      </p>
    </div>
  );
}

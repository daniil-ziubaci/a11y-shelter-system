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
        <form action={formAction}>
          <input type="hidden" name="logId" value={latest.id} />
          <button type="submit" disabled={isPending}>
            {isPending ? "Отменяем…" : `Отменить: ${latest.label}`}
          </button>
        </form>
      ) : (
        <p>Нечего отменять.</p>
      )}
      <p role="status">{state?.message ?? ""}</p>
    </div>
  );
}

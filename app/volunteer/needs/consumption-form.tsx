"use client";

import { useActionState } from "react";
import { recordConsumption } from "@/app/volunteer/needs/consumption/actions";

export function ConsumptionForm({
  itemId,
  itemName,
  closed,
}: {
  itemId: string;
  itemName: string;
  closed: boolean;
}) {
  const [state, formAction, isPending] = useActionState(
    recordConsumption,
    undefined,
  );
  const values = state && !state.ok ? state.values : undefined;
  const inputId = `consumption-${itemId}`;

  return (
    <details className="group rounded-lg border border-(--border)">
      <summary
        aria-label={`Расход: ${itemName}`}
        className="flex h-10 cursor-pointer list-none items-center justify-between px-3 font-medium [&::-webkit-details-marker]:hidden"
      >
        Расход
        <span
          aria-hidden="true"
          className="text-(--muted) transition-transform group-open:rotate-180"
        >
          ▾
        </span>
      </summary>
      <form action={formAction} className="flex flex-col gap-2 p-3 pt-1">
        <input type="hidden" name="itemId" value={itemId} />
        <label htmlFor={inputId} className="font-medium">
          {closed
            ? "Закончилось? Сколько нужно снова:"
            : "Сколько израсходовали:"}
        </label>
        <input
          id={inputId}
          name="amount"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          defaultValue={values?.amount}
          required
          className="h-10 w-full rounded-lg border border-(--border-strong) bg-(--surface) px-3 text-base"
        />
        {state && !state.ok && (
          <p role="alert" className="font-medium text-(--danger)">
            {state.error}
          </p>
        )}
        <button
          type="submit"
          disabled={isPending}
          aria-label={`Записать расход: ${itemName}`}
          className="h-10 w-full cursor-pointer rounded-lg bg-(--accent) px-6 font-semibold text-white disabled:cursor-wait disabled:opacity-60"
        >
          {isPending ? "Записываем…" : "Записать"}
        </button>
        <p role="status" className="font-medium empty:hidden">
          {state?.ok ? state.message : ""}
        </p>
      </form>
    </details>
  );
}

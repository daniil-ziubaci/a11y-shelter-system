"use client";

import { useActionState } from "react";
import { receivePurchase } from "@/app/volunteer/needs/receive/actions";
import { formatRemaining } from "@/lib/formatRemaining";

type ReceiveItem = {
  id: string;
  name: string;
  unit: string;
  remaining: number;
};

export function ReceiveForm({ items }: { items: ReceiveItem[] }) {
  const [state, formAction, isPending] = useActionState(
    receivePurchase,
    undefined,
  );
  const values = state && !state.ok ? state.values : undefined;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="itemId">Позиция</label>
        <select
          id="itemId"
          name="itemId"
          defaultValue={values?.itemId ?? ""}
          required
        >
          <option value="" disabled>
            Выберите позицию
          </option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}: {formatRemaining(item.remaining, item.unit)}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="amount">Сколько купили</label>
        <input
          id="amount"
          name="amount"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          defaultValue={values?.amount}
          aria-describedby="amount-hint"
          required
        />
        <p id="amount-hint">
          Обычное число, например 2,5. Единица берётся из позиции.
        </p>
      </div>

      {state && !state.ok && <p role="alert">{state.error}</p>}

      <button type="submit" disabled={isPending}>
        {isPending ? "Записываем…" : "Записать покупку"}
      </button>

      <p role="status">{state?.ok ? state.message : ""}</p>
    </form>
  );
}

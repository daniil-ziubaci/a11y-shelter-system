"use client";

import { useActionState } from "react";
import { receivePurchase } from "@/app/volunteer/needs/receive/actions";
import { formatRemaining } from "@/lib/formatRemaining";
import {
  fieldClass,
  hintClass,
  labelClass,
  primaryButtonClass,
  selectClass,
} from "@/lib/formClasses";
import { SelectWrap } from "@/components/SelectWrap";

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
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-2xl border border-(--border) bg-(--surface) p-4 shadow-md sm:mx-auto sm:w-[calc(50%-0.5rem)] sm:p-6"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="itemId" className={labelClass}>
          Позиция
        </label>
        <SelectWrap><select
          id="itemId"
          name="itemId"
          defaultValue={values?.itemId ?? ""}
          required
          className={selectClass}
        >
          <option value="" disabled>
            Выберите позицию
          </option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}: {formatRemaining(item.remaining, item.unit)}
            </option>
          ))}
        </select></SelectWrap>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="amount" className={labelClass}>
          Сколько получили
        </label>
        <input
          id="amount"
          name="amount"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          defaultValue={values?.amount}
          aria-describedby="amount-hint"
          required
          className={fieldClass}
        />
        <p id="amount-hint" className={hintClass}>
          Обычное число, например 2,5. Единица берётся из позиции.
        </p>
      </div>

      {state && !state.ok && (
        <p role="alert" className="font-medium text-(--danger)">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={isPending} className={primaryButtonClass}>
        {isPending ? "Записываем…" : "Записать"}
      </button>

      <p role="status" className="font-medium empty:hidden">
        {state?.ok ? state.message : ""}
      </p>
    </form>
  );
}

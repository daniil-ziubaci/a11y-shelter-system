"use client";

import { useActionState } from "react";
import { createNeed } from "@/app/volunteer/needs/new/actions";
import { NEED_CATEGORIES } from "@/lib/needCategories";
import { NEED_UNITS } from "@/lib/needUnits";

export function NewNeedForm() {
  const [state, formAction, isPending] = useActionState(createNeed, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <label htmlFor="name">Название</label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="off"
          maxLength={100}
          defaultValue={state?.values.name}
          aria-describedby="name-hint"
          required
        />
        <p id="name-hint">
          Например, «Корм для щенков». Не пишите телефоны и фамилии людей.
        </p>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="category">Категория</label>
        <select
          id="category"
          name="category"
          defaultValue={state?.values.category ?? ""}
          required
        >
          <option value="" disabled>
            Выберите категорию
          </option>
          {NEED_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category[0].toUpperCase() + category.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="unit">Единица измерения</label>
        <select
          id="unit"
          name="unit"
          defaultValue={state?.values.unit ?? ""}
          required
        >
          <option value="" disabled>
            Выберите единицу
          </option>
          {NEED_UNITS.map((unit) => (
            <option key={unit} value={unit}>
              {unit}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="quantity">Нужное количество</label>
        <input
          id="quantity"
          name="quantity"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          defaultValue={state?.values.quantity}
          aria-describedby="quantity-hint"
          required
        />
        <p id="quantity-hint">
          Сколько нужно купить, например 2,5. Единица выбрана выше.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <input
            id="is_urgent"
            name="is_urgent"
            type="checkbox"
            defaultChecked={state?.values.is_urgent === "on"}
            aria-describedby="is-urgent-hint"
          />
          <label htmlFor="is_urgent">Срочно нужно</label>
        </div>
        <p id="is-urgent-hint">
          Срочные позиции показываются в списке первыми. Если срочным станет
          всё, отметка перестанет что-то значить.
        </p>
      </div>

      {state?.error && <p role="alert">{state.error}</p>}

      <button type="submit" disabled={isPending}>
        {isPending ? "Сохраняем…" : "Добавить позицию"}
      </button>
    </form>
  );
}

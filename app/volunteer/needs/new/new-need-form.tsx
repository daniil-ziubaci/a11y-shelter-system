"use client";

import { ContactsHint } from "@/components/ContactsHint";
import { useActionState } from "react";
import { createNeed } from "@/app/volunteer/needs/new/actions";
import { NEED_CATEGORIES } from "@/lib/needCategories";
import { NEED_UNITS } from "@/lib/needUnits";
import {
  fieldClass,
  hintClass,
  labelClass,
  primaryButtonClass,
  radioRowClass,
  selectClass,
} from "@/lib/formClasses";
import { SelectWrap } from "@/components/SelectWrap";

export function NewNeedForm() {
  const [state, formAction, isPending] = useActionState(createNeed, undefined);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-6 rounded-2xl border border-(--border) bg-(--surface) p-4 shadow-sm sm:mx-auto sm:w-[calc(50%-0.5rem)] sm:p-6"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className={labelClass}>
          Название
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="off"
          maxLength={100}
          defaultValue={state?.values.name}
          aria-describedby="name-hint name-contacts"
          required
          className={fieldClass}
        />
        <p id="name-hint" className={hintClass}>
          Например, «Корм для щенков».
        </p>
        <ContactsHint id="name-contacts" />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="category" className={labelClass}>
          Категория
        </label>
        <SelectWrap><select
          id="category"
          name="category"
          defaultValue={state?.values.category ?? ""}
          required
          className={selectClass}
        >
          <option value="" disabled>
            Выберите категорию
          </option>
          {NEED_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category[0].toUpperCase() + category.slice(1)}
            </option>
          ))}
        </select></SelectWrap>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="unit" className={labelClass}>
          Единица измерения
        </label>
        <SelectWrap><select
          id="unit"
          name="unit"
          defaultValue={state?.values.unit ?? ""}
          required
          className={selectClass}
        >
          <option value="" disabled>
            Выберите единицу
          </option>
          {NEED_UNITS.map((unit) => (
            <option key={unit} value={unit}>
              {unit}
            </option>
          ))}
        </select></SelectWrap>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="quantity" className={labelClass}>
          Нужное количество
        </label>
        <input
          id="quantity"
          name="quantity"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          defaultValue={state?.values.quantity}
          aria-describedby="quantity-hint"
          required
          className={fieldClass}
        />
        <p id="quantity-hint" className={hintClass}>
          Сколько нужно купить, например 2,5. Единица выбрана выше.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="is_urgent" className={`${radioRowClass} self-start`}>
          <input
            id="is_urgent"
            name="is_urgent"
            type="checkbox"
            defaultChecked={state?.values.is_urgent === "on"}
            aria-describedby="is-urgent-hint"
            className="h-5 w-5 shrink-0 cursor-pointer"
          />
          <span>Срочно нужно</span>
        </label>
        <p id="is-urgent-hint" className={hintClass}>
          Срочные позиции показываются в списке первыми. Если срочным станет
          всё, отметка перестанет что-то значить.
        </p>
      </div>

      {state?.error && (
        <p role="alert" className="font-medium text-(--danger)">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={isPending} className={primaryButtonClass}>
        {isPending ? "Сохраняем…" : "Добавить позицию"}
      </button>
    </form>
  );
}

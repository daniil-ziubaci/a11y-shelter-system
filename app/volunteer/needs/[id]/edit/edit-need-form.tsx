"use client";

import { ContactsHint } from "@/components/ContactsHint";
import { useActionState } from "react";
import { updateNeed } from "@/app/volunteer/needs/[id]/edit/actions";
import { NEED_CATEGORIES } from "@/lib/needCategories";
import {
  fieldClass,
  hintClass,
  labelClass,
  primaryButtonClass,
  radioRowClass,
  selectClass,
} from "@/lib/formClasses";
import { SelectWrap } from "@/components/SelectWrap";

type EditNeedItem = {
  id: string;
  name: string;
  category: string;
  is_urgent: boolean;
};

export function EditNeedForm({
  item,
  from,
}: {
  item: EditNeedItem;
  from?: string;
}) {
  const [state, formAction, isPending] = useActionState(updateNeed, undefined);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-6 rounded-2xl border border-(--border) bg-(--surface) p-4 shadow-sm sm:mx-auto sm:w-[calc(50%-0.5rem)] sm:p-6"
    >
      <input type="hidden" name="itemId" value={item.id} />
      {from && <input type="hidden" name="from" value={from} />}

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
          defaultValue={state?.values.name ?? item.name}
          aria-describedby="name-hint name-contacts"
          required
          className={fieldClass}
        />
        <p id="name-hint" className={hintClass}>
          Единицу и количество здесь изменить нельзя: количество меняется
          приёмкой товара.
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
          defaultValue={state?.values.category ?? item.category}
          required
          className={selectClass}
        >
          {NEED_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category[0].toUpperCase() + category.slice(1)}
            </option>
          ))}
        </select></SelectWrap>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="is_urgent" className={`${radioRowClass} self-start`}>
          <input
            id="is_urgent"
            name="is_urgent"
            type="checkbox"
            defaultChecked={
              state ? state.values.is_urgent === "on" : item.is_urgent
            }
            aria-describedby="is-urgent-hint"
            className="h-5 w-5 shrink-0 cursor-pointer"
          />
          <span>Срочно нужно</span>
        </label>
        <p id="is-urgent-hint" className={hintClass}>
          Срочные позиции показываются в списке первыми. Снимите отметку, когда
          срочность прошла.
        </p>
      </div>

      {state?.error && (
        <p role="alert" className="font-medium text-(--danger)">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={isPending} className={primaryButtonClass}>
        {isPending ? "Сохраняем…" : "Сохранить"}
      </button>
    </form>
  );
}

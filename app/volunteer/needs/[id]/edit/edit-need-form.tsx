"use client";

import { ContactsHint } from "@/components/ContactsHint";
import { useActionState } from "react";
import { updateNeed } from "@/app/volunteer/needs/[id]/edit/actions";
import { NEED_CATEGORIES } from "@/lib/needCategories";

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
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="itemId" value={item.id} />
      {from && <input type="hidden" name="from" value={from} />}
      <div className="flex flex-col gap-1">
        <label htmlFor="name">Название</label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="off"
          maxLength={100}
          defaultValue={state?.values.name ?? item.name}
          aria-describedby="name-hint name-contacts"
          required
        />
        <p id="name-hint">
          Единицу и количество здесь изменить нельзя: количество меняется
          приёмкой товара.
        </p>
        <ContactsHint id="name-contacts" />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="category">Категория</label>
        <select
          id="category"
          name="category"
          defaultValue={state?.values.category ?? item.category}
          required
        >
          {NEED_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category[0].toUpperCase() + category.slice(1)}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <input
            id="is_urgent"
            name="is_urgent"
            type="checkbox"
            defaultChecked={
              state ? state.values.is_urgent === "on" : item.is_urgent
            }
            aria-describedby="is-urgent-hint"
          />
          <label htmlFor="is_urgent">Срочно нужно</label>
        </div>
        <p id="is-urgent-hint">
          Срочные позиции показываются в списке первыми. Снимите отметку, когда
          срочность прошла.
        </p>
      </div>
      {state?.error && <p role="alert">{state.error}</p>}
      <button type="submit" disabled={isPending}>
        {isPending ? "Сохраняем…" : "Сохранить"}
      </button>
    </form>
  );
}

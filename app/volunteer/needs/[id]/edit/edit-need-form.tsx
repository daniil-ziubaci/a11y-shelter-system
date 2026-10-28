"use client";

import { useActionState } from "react";
import { updateNeed } from "@/app/volunteer/needs/[id]/edit/actions";
import { NEED_CATEGORIES } from "@/lib/needCategories";

type EditNeedItem = {
  id: string;
  name: string;
  category: string;
};

export function EditNeedForm({ item }: { item: EditNeedItem }) {
  const [state, formAction, isPending] = useActionState(updateNeed, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="itemId" value={item.id} />

      <div className="flex flex-col gap-1">
        <label htmlFor="name">Название</label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="off"
          maxLength={100}
          defaultValue={state?.values.name ?? item.name}
          aria-describedby="name-hint"
          required
        />
        <p id="name-hint">
          Не пишите телефоны и фамилии людей. Единицу и количество здесь
          изменить нельзя: количество меняется приёмкой товара.
        </p>
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

      {state?.error && <p role="alert">{state.error}</p>}

      <button type="submit" disabled={isPending}>
        {isPending ? "Сохраняем…" : "Сохранить"}
      </button>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { createProject } from "@/app/volunteer/projects/new/actions";
import { PROJECT_LIMITS } from "@/lib/parseProjectFields";

export function NewProjectForm() {
  const [state, formAction, isPending] = useActionState(
    createProject,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <label htmlFor="title">Название</label>
        <input
          id="title"
          name="title"
          type="text"
          autoComplete="off"
          maxLength={PROJECT_LIMITS.title}
          defaultValue={state?.values.title}
          aria-describedby="title-hint"
          required
        />
        <p id="title-hint">Например, «Тёплые вольеры к зиме».</p>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="description">Описание</label>
        <textarea
          id="description"
          name="description"
          rows={6}
          maxLength={PROJECT_LIMITS.description}
          defaultValue={state?.values.description}
          aria-describedby="description-hint"
          required
        />
        <p id="description-hint">
          Что нужно сделать и зачем, до {PROJECT_LIMITS.description} знаков. Не
          пишите телефоны, номера карт, реквизиты и суммы: помощь идёт через
          контакт приюта.
        </p>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="goal">Цель (необязательно)</label>
        <input
          id="goal"
          name="goal"
          type="text"
          autoComplete="off"
          maxLength={PROJECT_LIMITS.goal}
          defaultValue={state?.values.goal}
          aria-describedby="goal-hint"
        />
        <p id="goal-hint">
          Одной фразой и без сумм, например «утеплить 12 вольеров до декабря».
        </p>
      </div>

      {state?.error && <p role="alert">{state.error}</p>}

      <button type="submit" disabled={isPending}>
        {isPending ? "Сохраняем…" : "Добавить проект"}
      </button>
    </form>
  );
}

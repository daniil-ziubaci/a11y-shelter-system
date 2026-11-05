"use client";

import { ContactsHint } from "@/components/ContactsHint";
import { useActionState } from "react";
import { createProject } from "@/app/volunteer/projects/new/actions";
import { PROJECT_LIMITS } from "@/lib/parseProjectFields";
import {
  DEFAULT_PROJECT_HELP_KINDS,
  PROJECT_HELP_KINDS,
  PROJECT_HELP_KIND_LABELS,
} from "@/lib/projectHelpKinds";
import { DEFAULT_PROJECT_STAGE, PROJECT_STAGES } from "@/lib/projectStages";

export function NewProjectForm() {
  const [state, formAction, isPending] = useActionState(
    createProject,
    undefined,
  );

  const selectedHelpKinds: string[] = state
    ? (state.values.help_kinds ?? "").split(",")
    : DEFAULT_PROJECT_HELP_KINDS;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <ContactsHint id="contacts-hint" />
      <div className="flex flex-col gap-1">
        <label htmlFor="title">Название</label>
        <input
          id="title"
          name="title"
          type="text"
          autoComplete="off"
          maxLength={PROJECT_LIMITS.title}
          defaultValue={state?.values.title}
          aria-describedby="title-hint contacts-hint"
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
          aria-describedby="description-hint description-format-hint contacts-hint"
          required
        />
        <p id="description-hint">
          Что нужно сделать и зачем, до {PROJECT_LIMITS.description} знаков. Не
          пишите телефоны, номера карт, реквизиты и суммы: помощь идёт через
          контакт приюта.
        </p>
        <p id="description-format-hint">
          Пустая строка начинает новый абзац. Чтобы получился список, начните
          каждую строку с «- » (дефис и пробел). Ссылки и картинки вставить
          нельзя: текст показывается как есть.
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
          aria-describedby="goal-hint contacts-hint"
        />
        <p id="goal-hint">
          Одной фразой и без сумм, например «утеплить 12 вольеров до декабря».
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="stage">Этап</label>
        <select
          id="stage"
          name="stage"
          defaultValue={state?.values.stage ?? DEFAULT_PROJECT_STAGE}
          aria-describedby="stage-hint"
          required
        >
          {PROJECT_STAGES.map((stage) => (
            <option key={stage} value={stage}>
              {stage[0].toUpperCase() + stage.slice(1)}
            </option>
          ))}
        </select>
        <p id="stage-hint">
          На каком этапе проект сейчас. Посетители увидят этот этап словами.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="photo">Фото (необязательно)</label>
        <input
          id="photo"
          name="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          aria-describedby="photo-hint"
        />
        <p id="photo-hint">
          Формат JPEG, PNG или WebP. Загружайте только фото, снятые в приюте или
          с разрешения автора. После ошибки фото нужно выбрать заново.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="photoAlt">Описание фото</label>
        <input
          id="photoAlt"
          name="photoAlt"
          type="text"
          autoComplete="off"
          maxLength={PROJECT_LIMITS.photoAlt}
          defaultValue={state?.values.photoAlt}
          aria-describedby="photo-alt-hint contacts-hint"
        />
        <p id="photo-alt-hint">
          Обязательно, если выбрали фото. Опишите, что на нём, для человека,
          который его не видит. Например: «Утеплённый вольер с соломой».
        </p>
      </div>

      <fieldset
        className="flex flex-col gap-1"
        aria-describedby="help-kinds-hint"
      >
        <legend>Чем можно помочь</legend>
        {PROJECT_HELP_KINDS.map((kind) => (
          <label key={kind} className="flex min-h-11 items-center gap-2">
            <input
              type="checkbox"
              name="help_kinds"
              value={kind}
              defaultChecked={selectedHelpKinds.includes(kind)}
            />
            {PROJECT_HELP_KIND_LABELS[kind]}
          </label>
        ))}
        <p id="help-kinds-hint">
          Отметьте всё, что подходит. Если нужны вещи, напишите в описании, что
          вы принимаете, что нет и как привезти.
        </p>
      </fieldset>

      <fieldset
        className="flex flex-col gap-4"
        aria-describedby="progress-hint contacts-hint"
      >
        <legend>Счёт дел (необязательно)</legend>
        <div className="flex flex-col gap-1">
          <label htmlFor="progressTotal">Сколько всего</label>
          <input
            id="progressTotal"
            name="progressTotal"
            type="number"
            inputMode="numeric"
            min={1}
            max={PROJECT_LIMITS.progressMax}
            defaultValue={state?.values.progressTotal}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="progressDone">Сколько сделано</label>
          <input
            id="progressDone"
            name="progressDone"
            type="number"
            inputMode="numeric"
            min={0}
            max={PROJECT_LIMITS.progressMax}
            defaultValue={state?.values.progressDone}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="progressUnit">Что считаем</label>
          <input
            id="progressUnit"
            name="progressUnit"
            type="text"
            autoComplete="off"
            maxLength={PROJECT_LIMITS.progressUnit}
            defaultValue={state?.values.progressUnit}
          />
        </div>
        <p id="progress-hint">
          Считаем дела и вещи, не деньги. Например: всего 20, сделано 2, считаем
          «вольеров». Заполните все три поля или оставьте пустыми.
        </p>
      </fieldset>

      {state?.error && <p role="alert">{state.error}</p>}

      <button type="submit" disabled={isPending}>
        {isPending ? "Сохраняем…" : "Добавить проект"}
      </button>
    </form>
  );
}

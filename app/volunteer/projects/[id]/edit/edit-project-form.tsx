"use client";

import { ContactsHint } from "@/components/ContactsHint";
import {
  fieldClass,
  hintClass,
  labelClass,
  primaryButtonClass,
  radioRowClass,
  textareaClass,
} from "@/lib/formClasses";
import { PhotoField } from "@/components/PhotoField";
import { useActionState } from "react";
import { updateProject } from "@/app/volunteer/projects/[id]/edit/actions";
import { PROJECT_LIMITS } from "@/lib/parseProjectFields";
import {
  PROJECT_HELP_KINDS,
  PROJECT_HELP_KIND_LABELS,
} from "@/lib/projectHelpKinds";

type EditableProject = {
  id: string;
  title: string;
  description: string;
  help_kinds: string[];
  photo_path: string | null;
  photo_alt: string | null;
  progress_total: number | null;
  progress_done: number | null;
  progress_unit: string | null;
};

export function EditProjectForm({
  project,
  photoUrl,
}: {
  project: EditableProject;
  photoUrl: string | null;
}) {
  const [state, formAction, isPending] = useActionState(
    updateProject,
    undefined,
  );

  const selectedHelpKinds = state
    ? (state.values.help_kinds ?? "").split(",")
    : project.help_kinds;

  return (
    <form action={formAction} className="flex flex-col gap-6 rounded-2xl border border-(--border) bg-(--surface) p-4 shadow-sm sm:mx-auto sm:w-[calc(50%-0.5rem)] sm:p-6">
      <ContactsHint id="contacts-hint" />
      <input type="hidden" name="projectId" value={project.id} />
      <div className="flex flex-col gap-1">
        <label htmlFor="title" className={labelClass}>Название</label>
        <textarea
          className={textareaClass}
          id="title"
          name="title"
          rows={2}
          maxLength={PROJECT_LIMITS.title}
          defaultValue={state?.values.title ?? project.title}
          aria-describedby="contacts-hint"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
            }
          }}
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="description" className={labelClass}>Описание</label>
        <textarea
          className={textareaClass}
          id="description"
          name="description"
          rows={6}
          maxLength={PROJECT_LIMITS.description}
          defaultValue={state?.values.description ?? project.description}
          aria-describedby="description-hint description-format-hint contacts-hint"
          required
        />
        <p id="description-hint" className={hintClass}>
          Что нужно сделать и зачем, до {PROJECT_LIMITS.description} знаков. Не
          пишите телефоны, номера карт, реквизиты и суммы: помощь идёт через
          контакт приюта.
        </p>
        <p id="description-format-hint" className={hintClass}>
          Пустая строка начинает новый абзац. Чтобы получился список, начните
          каждую строку с «- » (дефис и пробел). Ссылки и картинки вставить
          нельзя: текст показывается как есть.
        </p>
      </div>

      

      

      <PhotoField
        id="photo"
        name="photo"
        label="Фото (необязательно)"
        hint="Формат JPEG, PNG или WebP. Загружайте только фото, снятые в приюте или с разрешения автора. После ошибки фото нужно выбрать заново."
        currentUrl={photoUrl}
      />

      <div className="flex flex-col gap-1">
        <label htmlFor="photoAlt" className={labelClass}>Описание фото</label>
        <textarea
          className={textareaClass}
          id="photoAlt"
          name="photoAlt"
          rows={2}
          maxLength={PROJECT_LIMITS.photoAlt}
          defaultValue={state?.values.photoAlt ?? project.photo_alt ?? ""}
          aria-describedby="photo-alt-hint contacts-hint"
        />
        <p id="photo-alt-hint" className={hintClass}>
          Обязательно, если есть фото. Опишите, что на нём, для человека,
          который его не видит. Например: «Утеплённый вольер с соломой».
        </p>
      </div>

      <fieldset
        className="flex flex-wrap gap-2"
        aria-describedby="help-kinds-hint"
      >
        <legend className="mb-1 font-medium">Чем можно помочь</legend>
        {PROJECT_HELP_KINDS.map((kind) => (
          <label key={kind} className={radioRowClass}>
            <input
          className="h-5 w-5 shrink-0 cursor-pointer"
              type="checkbox"
              name="help_kinds"
              value={kind}
              defaultChecked={selectedHelpKinds.includes(kind)}
            />
            {PROJECT_HELP_KIND_LABELS[kind]}
          </label>
        ))}
        <p id="help-kinds-hint" className={hintClass}>
          Отметьте всё, что подходит. Если нужны вещи, напишите в описании, что
          вы принимаете, что нет и как привезти.
        </p>
      </fieldset>

      <fieldset
        className="flex flex-col gap-4"
        aria-describedby="progress-hint contacts-hint"
      >
        <legend className="mb-1 font-medium">Цель и счёт дел (необязательно)</legend>
        <div className="flex flex-col gap-1">
          <label htmlFor="progressTotal" className={labelClass}>Сколько всего</label>
          <input
          className={fieldClass}
            id="progressTotal"
            name="progressTotal"
            type="number"
            inputMode="numeric"
            min={1}
            max={PROJECT_LIMITS.progressMax}
            defaultValue={
              state?.values.progressTotal ?? project.progress_total ?? ""
            }
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="progressDone" className={labelClass}>Сколько сделано</label>
          <input
          className={fieldClass}
            id="progressDone"
            name="progressDone"
            type="number"
            inputMode="numeric"
            min={0}
            max={PROJECT_LIMITS.progressMax}
            defaultValue={
              state?.values.progressDone ?? project.progress_done ?? ""
            }
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="progressUnit" className={labelClass}>Что считаем</label>
          <input
          className={fieldClass}
            id="progressUnit"
            name="progressUnit"
            type="text"
            autoComplete="off"
            maxLength={PROJECT_LIMITS.progressUnit}
            defaultValue={
              state?.values.progressUnit ?? project.progress_unit ?? ""
            }
          />
        </div>
        <p id="progress-hint" className={hintClass}>
          «Сколько всего» это цель проекта. Считаем дела и вещи, не деньги. Например: всего 20, сделано 2, считаем «вольеров». Когда «Сколько сделано» сравняется с «Сколько всего», проект станет завершённым. Заполните все три поля или оставьте пустыми.
        </p>
      </fieldset>

      {state?.error && <p role="alert" className="font-medium text-(--danger)">{state.error}</p>}

      <button type="submit" disabled={isPending} className={primaryButtonClass}>
        {isPending ? "Сохраняем…" : "Сохранить проект"}
      </button>
    </form>
  );
}

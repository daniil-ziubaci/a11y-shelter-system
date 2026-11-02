"use client";

import { useActionState } from "react";
import { updateProject } from "@/app/volunteer/projects/[id]/edit/actions";
import { PROJECT_LIMITS } from "@/lib/parseProjectFields";
import {
  PROJECT_HELP_KINDS,
  PROJECT_HELP_KIND_LABELS,
} from "@/lib/projectHelpKinds";
import { PROJECT_STAGES } from "@/lib/projectStages";

type EditableProject = {
  id: string;
  title: string;
  description: string;
  goal: string | null;
  stage: string;
  help_kinds: string[];
  photo_path: string | null;
  photo_alt: string | null;
};

export function EditProjectForm({ project }: { project: EditableProject }) {
  const [state, formAction, isPending] = useActionState(
    updateProject,
    undefined,
  );

  const selectedHelpKinds = state
    ? (state.values.help_kinds ?? "").split(",")
    : project.help_kinds;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="projectId" value={project.id} />
      <div className="flex flex-col gap-1">
        <label htmlFor="title">Название</label>
        <input
          id="title"
          name="title"
          type="text"
          autoComplete="off"
          maxLength={PROJECT_LIMITS.title}
          defaultValue={state?.values.title ?? project.title}
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="description">Описание</label>
        <textarea
          id="description"
          name="description"
          rows={6}
          maxLength={PROJECT_LIMITS.description}
          defaultValue={state?.values.description ?? project.description}
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
          defaultValue={state?.values.goal ?? project.goal ?? ""}
          aria-describedby="goal-hint"
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
          defaultValue={state?.values.stage ?? project.stage}
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
          {project.photo_path
            ? "Фото уже загружено. Чтобы заменить его, выберите новый файл. "
            : ""}
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
          defaultValue={state?.values.photoAlt ?? project.photo_alt ?? ""}
          aria-describedby="photo-alt-hint"
        />
        <p id="photo-alt-hint">
          Обязательно, если есть фото. Опишите, что на нём, для человека,
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

      {state?.error && <p role="alert">{state.error}</p>}

      <button type="submit" disabled={isPending}>
        {isPending ? "Сохраняем…" : "Сохранить проект"}
      </button>
    </form>
  );
}

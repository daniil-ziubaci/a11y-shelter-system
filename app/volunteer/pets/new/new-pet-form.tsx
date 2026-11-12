"use client";

import {
  fieldClass,
  hintClass,
  labelClass,
  primaryButtonClass,
  radioRowClass,
  textareaClass,
} from "@/lib/formClasses";
import { PhotoField } from "@/components/PhotoField";

import { ContactsHint } from "@/components/ContactsHint";
import { useActionState, useState } from "react";
import { createPet } from "@/app/volunteer/pets/new/actions";
import { PET_SIZES } from "@/lib/petSizes";

export function NewPetForm() {
  const [state, formAction, isPending] = useActionState(createPet, undefined);
  const [species, setSpecies] = useState(state?.values.species ?? "");

  return (
    <form
      action={formAction}
      className="flex flex-col gap-6 rounded-2xl border border-(--border) bg-(--surface) p-4 shadow-md sm:mx-auto sm:w-[calc(50%-0.5rem)] sm:p-6"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className={labelClass}>
          Кличка
        </label>
        <input
          className={fieldClass}
          id="name"
          name="name"
          type="text"
          autoComplete="off"
          defaultValue={state?.values.name}
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="enclosure" className={labelClass}>
          Вольер
        </label>
        <input
          className={fieldClass}
          id="enclosure"
          name="enclosure"
          type="text"
          maxLength={40}
          autoComplete="off"
          aria-describedby="enclosure-hint"
          defaultValue={state?.values.enclosure}
        />
        <p id="enclosure-hint" className={hintClass}>
          Коротко, например: 3 или необязательно. Видно только волонтёрам, на
          сайте не показывается.
        </p>
      </div>

      <fieldset className="flex flex-wrap gap-2">
        <legend className="mb-1 font-medium">Вид</legend>
        <label className={radioRowClass}>
          <input
            type="radio"
            className="h-5 w-5 shrink-0 cursor-pointer"
            name="species"
            value="собака"
            onChange={() => setSpecies("собака")}
            defaultChecked={state?.values.species === "собака"}
            required
          />{" "}
          Собака
        </label>
        <label className={radioRowClass}>
          <input
            type="radio"
            className="h-5 w-5 shrink-0 cursor-pointer"
            name="species"
            value="кошка"
            onChange={() => setSpecies("кошка")}
            defaultChecked={state?.values.species === "кошка"}
            required
          />{" "}
          Кошка
        </label>
      </fieldset>

      <fieldset className="flex flex-wrap gap-2">
        <legend className="mb-1 font-medium">Пол</legend>
        <label className={radioRowClass}>
          <input
            type="radio"
            className="h-5 w-5 shrink-0 cursor-pointer"
            name="sex"
            value="мальчик"
            defaultChecked={state?.values.sex === "мальчик"}
            required
          />{" "}
          Мальчик
        </label>
        <label className={radioRowClass}>
          <input
            type="radio"
            className="h-5 w-5 shrink-0 cursor-pointer"
            name="sex"
            value="девочка"
            defaultChecked={state?.values.sex === "девочка"}
            required
          />{" "}
          Девочка
        </label>
      </fieldset>

      {species === "собака" && (
        <fieldset className="flex flex-wrap gap-2" aria-describedby="size-hint">
          <legend className="mb-1 font-medium">Размер</legend>
          {PET_SIZES.map((size) => (
            <label key={size} className={radioRowClass}>
              <input
                type="radio"
                className="h-5 w-5 shrink-0 cursor-pointer"
                name="size"
                value={size}
                defaultChecked={state?.values.size === size}
                required
              />{" "}
              {size[0].toUpperCase() + size.slice(1)}
            </label>
          ))}
          <p id="size-hint" className={hintClass}>
            Оцените размер на глаз, взвешивать не нужно.
          </p>
        </fieldset>
      )}

      <fieldset className="flex flex-col gap-2" aria-describedby="age-hint">
        <legend className="mb-1 font-medium">Возраст</legend>
        <p id="age-hint" className={hintClass}>
          Если точная дата рождения известна, укажите её. Если нет, оставьте её
          пустой и укажите примерный возраст.
        </p>
        <div className="flex flex-col gap-1">
          <label htmlFor="birthDate" className={labelClass}>
            Дата рождения
          </label>
          <input
            className={fieldClass}
            id="birthDate"
            name="birthDate"
            type="date"
            defaultValue={state?.values.birthDate}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="ageYears" className={labelClass}>
            Примерный возраст: полных лет
          </label>
          <input
            className={fieldClass}
            id="ageYears"
            name="ageYears"
            type="number"
            inputMode="numeric"
            min={0}
            max={30}
            defaultValue={state?.values.ageYears}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="ageMonths" className={labelClass}>
            и месяцев
          </label>
          <input
            className={fieldClass}
            id="ageMonths"
            name="ageMonths"
            type="number"
            inputMode="numeric"
            min={0}
            max={11}
            defaultValue={state?.values.ageMonths}
          />
        </div>
      </fieldset>

      <PhotoField
        copies
        id="photo"
        name="photo"
        label="Фото"
        hint={
          "Формат JPEG, PNG или WebP. Место съёмки из фото удаляется автоматически. После ошибки фото нужно выбрать заново."
        }
        required
      />

      <div className="flex flex-col gap-1">
        <label htmlFor="photoAlt" className={labelClass}>
          Описание фото
        </label>
        <textarea
          className={textareaClass}
          id="photoAlt"
          name="photoAlt"
          rows={2}
          aria-describedby="photo-alt-hint"
          defaultValue={state?.values.photoAlt}
          required
        />
        <p id="photo-alt-hint" className={hintClass}>
          Опишите, что на фото, для человека, который его не видит. Например:
          «Рыжая собака среднего размера».
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="health" className={labelClass}>
          Здоровье
        </label>
        <textarea
          className={textareaClass}
          id="health"
          name="health"
          rows={3}
          aria-describedby="text-hint"
          defaultValue={state?.values.health}
          required
        />
      </div>

      <div className="flex flex-col gap-3">
        <p className="-mt-3 font-medium text-(--accent)">
          Животное больное? Опишите здоровье выше и отметьте нужное: один пункт,
          оба или ни одного.
        </p>
        <label htmlFor="treatment-status" className={radioRowClass}>
          <input
            type="checkbox"
            id="treatment-status"
            name="treatmentStatus"
            defaultChecked={state?.values.treatmentStatus === "on"}
            className="h-5 w-5 shrink-0 cursor-pointer"
          />
          <span>Лечение: пока нельзя забрать</span>
        </label>
        <label htmlFor="needs-treatment" className={radioRowClass}>
          <input
            type="checkbox"
            id="needs-treatment"
            name="needsTreatment"
            defaultChecked={state?.values.needsTreatment === "on"}
            className="h-5 w-5 shrink-0 cursor-pointer"
          />
          <span>Срочно нужна помощь с лечением</span>
        </label>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="description" className={labelClass}>
          Описание, характер, история
        </label>
        <textarea
          className={textareaClass}
          id="description"
          name="description"
          rows={5}
          aria-describedby="text-hint"
          defaultValue={state?.values.description}
          required
        />
        <ContactsHint id="text-hint" />
      </div>

      <p role="alert" className="empty:hidden">
        {state?.error}
      </p>

      <button type="submit" disabled={isPending} className={primaryButtonClass}>
        {isPending ? "Сохраняем…" : "Добавить животное"}
      </button>
    </form>
  );
}

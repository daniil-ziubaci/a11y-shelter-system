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

import { PET_STATUS_TREATMENT } from "@/lib/petStatuses";
import { ContactsHint } from "@/components/ContactsHint";
import { updatePet } from "@/app/volunteer/pets/[id]/edit/actions";
import { monthsSince } from "@/lib/monthsSince";
import { PET_SIZES } from "@/lib/petSizes";
import { Tables } from "@/types/database";
import { useActionState, useState } from "react";

type Pet = Tables<"pets">;

export function EditPetForm({ pet }: { pet: Pet }) {
  const [state, formAction, isPending] = useActionState(updatePet, undefined);
  const [species, setSpecies] = useState(state?.values.species ?? pet.species);
  const totalMonths = Math.max(0, monthsSince(pet.birth_date));
  const exact = !pet.is_age_approximate;
  const initialBirthDate = exact ? pet.birth_date : "";
  const initialYears = exact ? "" : String(Math.floor(totalMonths / 12));
  const initialMonths = exact ? "" : String(totalMonths % 12);

  return (
    <form action={formAction} className="flex flex-col gap-6 rounded-2xl border border-(--border) bg-(--surface) p-4 shadow-md sm:mx-auto sm:w-[calc(50%-0.5rem)] sm:p-6">
      <input type="hidden" name="id" value={pet.id} />

      <div className="flex flex-col gap-1">
        <label htmlFor="name" className={labelClass}>Кличка</label>
        <input
          className={fieldClass}
          id="name"
          name="name"
          type="text"
          autoComplete="off"
          defaultValue={state?.values.name ?? pet.name}
          required
        />
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
            defaultChecked={(state?.values.species ?? pet.species) === "собака"}
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
            defaultChecked={(state?.values.species ?? pet.species) === "кошка"}
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
            defaultChecked={(state?.values.sex ?? pet.sex) === "мальчик"}
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
            defaultChecked={(state?.values.sex ?? pet.sex) === "девочка"}
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
                defaultChecked={(state?.values.size ?? pet.size) === size}
                required
              />{" "}
              {size[0].toUpperCase() + size.slice(1)}
            </label>
          ))}
          <p id="size-hint" className={hintClass}>Оцените размер на глаз, взвешивать не нужно.</p>
        </fieldset>
      )}
      <fieldset className="flex flex-col gap-2" aria-describedby="age-hint">
        <legend className="mb-1 font-medium">Возраст</legend>
        <p id="age-hint" className={hintClass}>
          Если точная дата рождения известна, укажите её. Если нет, оставьте её
          пустой и укажите примерный возраст.
        </p>
        <div className="flex flex-col gap-1">
          <label htmlFor="birthDate" className={labelClass}>Дата рождения</label>
          <input
            className={fieldClass}
            id="birthDate"
            name="birthDate"
            type="date"
            defaultValue={state?.values.birthDate ?? initialBirthDate}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="ageYears" className={labelClass}>Примерный возраст: полных лет</label>
          <input
            className={fieldClass}
            id="ageYears"
            name="ageYears"
            type="number"
            inputMode="numeric"
            min={0}
            max={30}
            defaultValue={state?.values.ageYears ?? initialYears}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="ageMonths" className={labelClass}>и месяцев</label>
          <input
            className={fieldClass}
            id="ageMonths"
            name="ageMonths"
            type="number"
            inputMode="numeric"
            min={0}
            max={11}
            defaultValue={state?.values.ageMonths ?? initialMonths}
          />
        </div>
      </fieldset>
      <PhotoField
        id="photo"
        name="photo"
        label="Новое фото (необязательно)"
        hint={"Если фото менять не нужно, оставьте поле пустым. Формат JPEG, PNG или WebP. Место съёмки из фото удаляется автоматически. Если загрузка не удалась, фото нужно выбрать заново."}
        currentUrl={pet.photo_url}
      />
      <div className="flex flex-col gap-1">
        <label htmlFor="photoAlt" className={labelClass}>Описание фото</label>
        <textarea
          className={textareaClass}
          id="photoAlt"
          name="photoAlt"
          rows={2}
          aria-describedby="photo-alt-hint"
          defaultValue={state?.values.photoAlt ?? pet.photo_alt}
          required
        />
        <p id="photo-alt-hint" className={hintClass}>
          Опишите, что на фото, для человека, который его не видит. Если меняете
          фото, обновите и описание.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="health" className={labelClass}>Здоровье</label>
        <textarea
          className={textareaClass}
          id="health"
          name="health"
          rows={3}
          aria-describedby="text-hint"
          defaultValue={state?.values.health ?? pet.health}
          required
        />
      </div>

      <div className="flex flex-col gap-3">
        <p className="-mt-3 font-medium text-(--accent)">
          Меняете лечение? Обновите описание здоровья и отметьте нужное: «пока
          нельзя забрать», «срочно нужна помощь» или оба пункта.
        </p>
        <label
          htmlFor="treatment-status"
          className="flex min-h-12 cursor-pointer items-center gap-3"
        >
          <input
            type="checkbox"
            id="treatment-status"
            name="treatmentStatus"
            defaultChecked={
              pet.status === PET_STATUS_TREATMENT ||
              state?.values.treatmentStatus === "on"
            }
            disabled={pet.status === PET_STATUS_TREATMENT}
            className="h-6 w-6 shrink-0 cursor-pointer"
          />
          <span>Лечение: пока нельзя забрать</span>
        </label>
        {pet.status === PET_STATUS_TREATMENT && (
          <p className={hintClass}>Чтобы снять этот статус, выберите другой в списке животных.</p>
        )}
        <label
          htmlFor="needs-treatment"
          className="flex min-h-12 cursor-pointer items-center gap-3"
        >
          <input
            type="checkbox"
            id="needs-treatment"
            name="needsTreatment"
            defaultChecked={
              state
                ? state.values.needsTreatment === "on"
                : pet.needs_treatment_since !== null
            }
            aria-describedby="needs-treatment-hint"
            className="h-6 w-6 shrink-0 cursor-pointer"
          />
          <span>Срочно нужна помощь с лечением</span>
        </label>

        <p id="needs-treatment-hint" className={hintClass}>
          Если включаете или оставляете отметку, проверьте, что описание
          здоровья выше актуально.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="description" className={labelClass}>Описание, характер, история</label>
        <textarea
          className={textareaClass}
          id="description"
          name="description"
          rows={5}
          aria-describedby="text-hint"
          defaultValue={state?.values.description ?? pet.description}
          required
        />
        <ContactsHint id="text-hint" />
      </div>
      <p role="alert" className="empty:hidden">{state?.error}</p>

      <button
        type="submit"
        disabled={isPending}
        className={primaryButtonClass}
      >
        {isPending ? "Сохраняем…" : "Сохранить изменения"}
      </button>
    </form>
  );
}

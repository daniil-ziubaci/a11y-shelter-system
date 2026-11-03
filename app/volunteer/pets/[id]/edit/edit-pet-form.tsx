"use client";

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
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="id" value={pet.id} />

      <div className="flex flex-col gap-1">
        <label htmlFor="name">Кличка</label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="off"
          defaultValue={state?.values.name ?? pet.name}
          required
        />
      </div>
      <fieldset className="flex flex-col gap-1">
        <legend>Вид</legend>
        <label>
          <input
            type="radio"
            name="species"
            value="собака"
            onChange={() => setSpecies("собака")}
            defaultChecked={(state?.values.species ?? pet.species) === "собака"}
            required
          />{" "}
          Собака
        </label>
        <label>
          <input
            type="radio"
            name="species"
            value="кошка"
            onChange={() => setSpecies("кошка")}
            defaultChecked={(state?.values.species ?? pet.species) === "кошка"}
            required
          />{" "}
          Кошка
        </label>
      </fieldset>

      <fieldset className="flex flex-col gap-1">
        <legend>Пол</legend>
        <label>
          <input
            type="radio"
            name="sex"
            value="мальчик"
            defaultChecked={(state?.values.sex ?? pet.sex) === "мальчик"}
            required
          />{" "}
          Мальчик
        </label>
        <label>
          <input
            type="radio"
            name="sex"
            value="девочка"
            defaultChecked={(state?.values.sex ?? pet.sex) === "девочка"}
            required
          />{" "}
          Девочка
        </label>
      </fieldset>
      {species === "собака" && (
        <fieldset className="flex flex-col gap-1" aria-describedby="size-hint">
          <legend>Размер</legend>
          {PET_SIZES.map((size) => (
            <label key={size}>
              <input
                type="radio"
                name="size"
                value={size}
                defaultChecked={(state?.values.size ?? pet.size) === size}
                required
              />{" "}
              {size[0].toUpperCase() + size.slice(1)}
            </label>
          ))}
          <p id="size-hint">Оцените размер на глаз, взвешивать не нужно.</p>
        </fieldset>
      )}
      <fieldset className="flex flex-col gap-2" aria-describedby="age-hint">
        <legend>Возраст</legend>
        <p id="age-hint">
          Если точная дата рождения известна, укажите её. Если нет, оставьте её
          пустой и укажите примерный возраст.
        </p>
        <div className="flex flex-col gap-1">
          <label htmlFor="birthDate">Дата рождения</label>
          <input
            id="birthDate"
            name="birthDate"
            type="date"
            defaultValue={state?.values.birthDate ?? initialBirthDate}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="ageYears">Примерный возраст: полных лет</label>
          <input
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
          <label htmlFor="ageMonths">и месяцев</label>
          <input
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
      <div className="flex flex-col gap-1">
        <label htmlFor="photo">Новое фото (необязательно)</label>
        <input
          id="photo"
          name="photo"
          type="file"
          accept="image/jpeg,image/png/webp"
          aria-describedby="photo-hint"
        />
        <p id="photo-hint">
          Если фото менять не нужно, оставьте поле пустым. Формат JPEG, PNG или
          WebP. Место съёмки из фото удаляется автоматически. Если загрузка не
          удалась, фото нужно выбрать заново.
        </p>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="photoAlt">Описание фото</label>
        <input
          id="photoAlt"
          name="photoAlt"
          type="text"
          autoComplete="off"
          aria-describedby="photo-alt-hint"
          defaultValue={state?.values.photoAlt ?? pet.photo_alt}
          required
        />
        <p id="photo-alt-hint">
          Опишите, что на фото, для человека, который его не видит. Если меняете
          фото, обновите и описание.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="health">Здоровье</label>
        <textarea
          id="health"
          name="health"
          rows={3}
          aria-describedby="text-hint"
          defaultValue={state?.values.health ?? pet.health}
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="description">Описание, характер, история</label>
        <textarea
          id="description"
          name="description"
          rows={5}
          aria-describedby="text-hint"
          defaultValue={state?.values.description ?? pet.description}
          required
        />
        <ContactsHint id="text-hint" />
      </div>
      <p role="alert">{state?.error}</p>

      <button type="submit" disabled={isPending}>
        {isPending ? "Сохраняем…" : "Сохранить изменения"}
      </button>
    </form>
  );
}

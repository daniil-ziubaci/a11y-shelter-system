"use client";

import { useActionState, useState } from "react";
import { createPet } from "@/app/volunteer/pets/new/actions";
import { PET_SIZES } from "@/lib/petSizes";

export function NewPetForm() {
  const [state, formAction, isPending] = useActionState(createPet, undefined);
  const [species, setSpecies] = useState(state?.values.species ?? "");

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <label htmlFor="name">Кличка</label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="off"
          defaultValue={state?.values.name}
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
            defaultChecked={state?.values.species === "собака"}
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
            defaultChecked={state?.values.species === "кошка"}
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
            defaultChecked={state?.values.sex === "мальчик"}
            required
          />{" "}
          Мальчик
        </label>
        <label>
          <input
            type="radio"
            name="sex"
            value="девочка"
            defaultChecked={state?.values.sex === "девочка"}
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
                defaultChecked={state?.values.size === size}
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
            defaultValue={state?.values.birthDate}
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
            defaultValue={state?.values.ageYears}
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
            defaultValue={state?.values.ageMonths}
          />
        </div>
      </fieldset>

      <div className="flex flex-col gap-1">
        <label htmlFor="photo">Фото</label>
        <input
          id="photo"
          name="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          aria-describedby="photo-hint"
          required
        />
        <p id="photo-hint">
          Формат JPEG, PNG или WebP. Место съёмки из фото удаляется
          автоматически. После ошибки фото нужно выбрать заново.
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
          defaultValue={state?.values.photoAlt}
          required
        />
        <p id="photo-alt-hint">
          Опишите, что на фото, для человека, который его не видит. Например:
          «Рыжая собака среднего размера».
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="health">Здоровье</label>
        <textarea
          id="health"
          name="health"
          rows={3}
          aria-describedby="text-hint"
          defaultValue={state?.values.health}
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
          defaultValue={state?.values.description}
          required
        />
        <p id="text-hint">
          Не пишите телефоны, адреса и фамилии людей. Подсказка относится к трём
          полям выше: питание, здоровье и описание.
        </p>
      </div>

      <p role="alert">{state?.error}</p>

      <button type="submit" disabled={isPending}>
        {isPending ? "Сохраняем…" : "Добавить животное"}
      </button>
    </form>
  );
}

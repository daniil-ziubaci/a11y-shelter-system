import { useState } from "react";
import { PhotoField } from "@/islands/PhotoField";
import { fieldClass, hintClass, labelClass, primaryButtonClass, radioRowClass, textareaClass } from "@/lib/formClasses";
import { PET_SIZES } from "@/lib/petSizes";

const CONTACTS_HINT =
  "Не пишите в текстах телефоны, почты, ссылки, адреса и фамилии людей. Если они есть, текст не сохранится: удалите их, и всё остальное останется.";

export type PetFormInitial = {
  name: string;
  enclosure: string;
  species: string;
  sex: string;
  size: string;
  birthDate: string;
  ageYears: string;
  ageMonths: string;
  photoAlt: string;
  health: string;
  description: string;
  treatmentStatus: boolean;
  needsTreatment: boolean;
};

export function PetForm({
  action,
  mode,
  initial,
  error,
  photoUrl,
  inTreatment = false,
}: {
  action: string;
  mode: "new" | "edit";
  initial: PetFormInitial;
  error: string | null;
  photoUrl?: string | null;
  inTreatment?: boolean;
}) {
  const [species, setSpecies] = useState(initial.species);
  const [pending, setPending] = useState(false);
  const radio = "h-5 w-5 shrink-0 cursor-pointer";

  return (
    <form
      method="post"
      action={action}
      encType="multipart/form-data"
      onSubmit={() => setPending(true)}
      className="flex flex-col gap-6 rounded-2xl border border-(--border) bg-(--surface) p-4 shadow-md sm:mx-auto sm:w-1/2 sm:p-6"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className={labelClass}>
          Кличка
        </label>
        <input className={fieldClass} id="name" name="name" type="text" autoComplete="off" defaultValue={initial.name} required />
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
          defaultValue={initial.enclosure}
        />
        <p id="enclosure-hint" className={hintClass}>
          Коротко, например: 3 или необязательно. Видно только волонтёрам, на сайте не показывается.
        </p>
      </div>

      <fieldset className="flex flex-wrap gap-2">
        <legend className="mb-1 font-medium">Вид</legend>
        {[
          ["собака", "Собака"],
          ["кошка", "Кошка"],
        ].map(([value, label]) => (
          <label key={value} className={radioRowClass}>
            <input
              type="radio"
              className={radio}
              name="species"
              value={value}
              onChange={() => setSpecies(value)}
              defaultChecked={initial.species === value}
              required
            />{" "}
            {label}
          </label>
        ))}
      </fieldset>

      <fieldset className="flex flex-wrap gap-2">
        <legend className="mb-1 font-medium">Пол</legend>
        {[
          ["мальчик", "Мальчик"],
          ["девочка", "Девочка"],
        ].map(([value, label]) => (
          <label key={value} className={radioRowClass}>
            <input type="radio" className={radio} name="sex" value={value} defaultChecked={initial.sex === value} required /> {label}
          </label>
        ))}
      </fieldset>

      {species === "собака" && (
        <fieldset className="flex flex-wrap gap-2" aria-describedby="size-hint">
          <legend className="mb-1 font-medium">Размер</legend>
          {PET_SIZES.map((size) => (
            <label key={size} className={radioRowClass}>
              <input type="radio" className={radio} name="size" value={size} defaultChecked={initial.size === size} required />{" "}
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
          Если точная дата рождения известна, укажите её. Если нет, оставьте её пустой и укажите примерный возраст.
        </p>
        <div className="flex flex-col gap-1">
          <label htmlFor="birthDate" className={labelClass}>
            Дата рождения
          </label>
          <input className={fieldClass} id="birthDate" name="birthDate" type="date" defaultValue={initial.birthDate} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="ageYears" className={labelClass}>
            Примерный возраст: полных лет
          </label>
          <input className={fieldClass} id="ageYears" name="ageYears" type="number" inputMode="numeric" min={0} max={30} defaultValue={initial.ageYears} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="ageMonths" className={labelClass}>
            и месяцев
          </label>
          <input className={fieldClass} id="ageMonths" name="ageMonths" type="number" inputMode="numeric" min={0} max={11} defaultValue={initial.ageMonths} />
        </div>
      </fieldset>

      <PhotoField
        copies
        id="photo"
        name="photo"
        label={mode === "new" ? "Фото" : "Новое фото (необязательно)"}
        hint={
          mode === "new"
            ? "Формат JPEG, PNG или WebP. Место съёмки из фото удаляется автоматически. После ошибки фото нужно выбрать заново."
            : "Если фото менять не нужно, оставьте поле пустым. Формат JPEG, PNG или WebP. Место съёмки из фото удаляется автоматически. Если загрузка не удалась, фото нужно выбрать заново."
        }
        currentUrl={photoUrl}
        required={mode === "new"}
      />

      <div className="flex flex-col gap-1">
        <label htmlFor="photoAlt" className={labelClass}>
          Описание фото
        </label>
        <textarea className={textareaClass} id="photoAlt" name="photoAlt" rows={2} aria-describedby="photo-alt-hint" defaultValue={initial.photoAlt} required />
        <p id="photo-alt-hint" className={hintClass}>
          {mode === "new"
            ? "Опишите, что на фото, для человека, который его не видит. Например: «Рыжая собака среднего размера»."
            : "Опишите, что на фото, для человека, который его не видит. Если меняете фото, обновите и описание."}
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="health" className={labelClass}>
          Здоровье
        </label>
        <textarea className={textareaClass} id="health" name="health" rows={3} aria-describedby="text-hint" defaultValue={initial.health} required />
      </div>

      <div className="flex flex-col gap-3">
        <p className="-mt-3 font-medium text-(--accent)">
          {mode === "new"
            ? "Животное больное? Опишите здоровье выше и отметьте нужное: один пункт, оба или ни одного."
            : "Меняете лечение? Обновите описание здоровья и отметьте нужное: «пока нельзя забрать», «срочно нужна помощь» или оба пункта."}
        </p>
        <label htmlFor="treatment-status" className={radioRowClass}>
          <input
            type="checkbox"
            id="treatment-status"
            name="treatmentStatus"
            defaultChecked={initial.treatmentStatus}
            disabled={inTreatment}
            className={radio}
          />
          <span>Лечение: пока нельзя забрать</span>
        </label>
        {inTreatment && <p className={hintClass}>Чтобы снять этот статус, выберите другой в списке животных.</p>}
        <label htmlFor="needs-treatment" className={radioRowClass}>
          <input
            type="checkbox"
            id="needs-treatment"
            name="needsTreatment"
            defaultChecked={initial.needsTreatment}
            aria-describedby={mode === "edit" ? "needs-treatment-hint" : undefined}
            className={radio}
          />
          <span>Срочно нужна помощь с лечением</span>
        </label>
        {mode === "edit" && (
          <p id="needs-treatment-hint" className={hintClass}>
            Если включаете или оставляете отметку, проверьте, что описание здоровья выше актуально.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="description" className={labelClass}>
          Описание, характер, история
        </label>
        <textarea className={textareaClass} id="description" name="description" rows={5} aria-describedby="text-hint" defaultValue={initial.description} required />
        <p id="text-hint" className={hintClass}>
          {CONTACTS_HINT}
        </p>
      </div>

      <p role="alert" className="font-medium text-(--danger) empty:hidden">
        {error}
      </p>

      <button type="submit" disabled={pending} className={primaryButtonClass}>
        {pending ? "Сохраняем…" : mode === "new" ? "Добавить животное" : "Сохранить изменения"}
      </button>
    </form>
  );
}

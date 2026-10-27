import { createClient } from "@/lib/supabase/server";
import { setPetStatus, setPetTreatment } from "@/app/volunteer/actions";
import { PET_STATUSES } from "@/lib/petStatuses";
import Link from "next/link";
import { isTreatmentStale } from "@/lib/treatmentReview";

export async function PetList({ shelterId }: { shelterId: string }) {
  const supabase = await createClient();
  const { data: pets, error } = await supabase
    .from("pets")
    .select("id, name, status, needs_treatment_since")
    .eq("shelter_id", shelterId)
    .order("name");

  if (error) {
    return <p role="alert">Не удалось загрузить список животных.</p>;
  }
  if (!pets || pets.length === 0) {
    return <p>Животных пока нет.</p>;
  }

  return (
    <ul>
      {pets.map((pet) => (
        <li key={pet.id}>
          {pet.name}, {pet.status}
          <Link
            href={`/volunteer/pets/${pet.id}/edit`}
            aria-label={`Редактировать: ${pet.name}`}
          >
            Редактировать
          </Link>
          <form action={setPetStatus}>
            <input type="hidden" name="petId" value={pet.id} />
            <label htmlFor={`status-${pet.id}`}>Статус: {pet.name}</label>
            <select
              id={`status-${pet.id}`}
              name="status"
              defaultValue={pet.status}
            >
              {PET_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button type="submit" aria-label={`Сохранить статус: ${pet.name}`}>
              Сохранить
            </button>
          </form>
          {pet.needs_treatment_since && (
            <p>
              Срочно нужна помощь с лечением — с{" "}
              {new Date(pet.needs_treatment_since).toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "long",
              })}
            </p>
          )}
          {isTreatmentStale(pet.needs_treatment_since) && (
            <p>Отметка стоит давно: проверьте, актуально ли.</p>
          )}
          <form action={setPetTreatment}>
            <input type="hidden" name="petId" value={pet.id} />
            <input
              type="checkbox"
              id={`treatment-${pet.id}`}
              name="needsTreatment"
              defaultChecked={pet.needs_treatment_since !== null}
            />
            <label htmlFor={`treatment-${pet.id}`}>
              Срочно нужна помощь с лечением: {pet.name}
            </label>
            <button
              type="submit"
              aria-label={`Сохранить отметку о лечении: ${pet.name}`}
            >
              Сохранить
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}

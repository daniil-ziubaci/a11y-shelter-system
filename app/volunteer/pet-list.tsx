import { createClient } from "@/lib/supabase/server";
import { setPetStatus, setPetTreatment } from "@/app/volunteer/actions";
import { PET_STATUS_LABELS, PET_STATUSES } from "@/lib/petStatuses";
import Link from "next/link";
import { isTreatmentStale } from "@/lib/treatmentReview";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { formatAge } from "@/lib/formatAge";
import { monthsSince } from "@/lib/monthsSince";
import { PET_SIZE_LABELS } from "@/lib/petSizes";

export async function PetList({ shelterId }: { shelterId: string }) {
  const supabase = await createClient();
  const { data: pets, error } = await supabase
    .from("pets")
    .select(
      "id, name, status, needs_treatment_since, photo_url, birth_date, is_age_approximate, sex, species, size",
    )
    .eq("shelter_id", shelterId)
    .order("name");

  if (error) {
    return <p role="alert">Не удалось загрузить список животных.</p>;
  }
  if (!pets || pets.length === 0) {
    return <p>Животных пока нет.</p>;
  }

  const tAge = await getTranslations({ locale: "ru", namespace: "Age" });

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {pets.map((pet) => (
        <li key={pet.id} className="flex flex-col gap-3 rounded border p-4">
          <div className="flex gap-4">
            <Image
              src={pet.photo_url}
              alt=""
              width={96}
              height={96}
              className="h-24 w-24 shrink-0 rounded object-cover"
            />
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold">{pet.name}</h2>
              <p>
                {pet.sex},{" "}
                {formatAge(
                  monthsSince(pet.birth_date),
                  pet.is_age_approximate,
                  tAge,
                )}
                {pet.size
                  ? `, размер: ${PET_SIZE_LABELS[pet.size] ?? pet.size}`
                  : ""}
              </p>
              <Link
                href={`/volunteer/pets/${pet.id}/edit`}
                aria-label={`Редактировать: ${pet.name}`}
                className="underline inline-block py-2"
              >
                Редактировать
              </Link>
            </div>
          </div>
          <form
            action={setPetStatus}
            className="flex flex-wrap items-center gap-2"
          >
            <input type="hidden" name="petId" value={pet.id} />
            <label htmlFor={`status-${pet.id}`}>Статус</label>
            <select
              id={`status-${pet.id}`}
              name="status"
              defaultValue={pet.status}
              aria-label={`Статус: ${pet.name}`}
            >
              {PET_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {PET_STATUS_LABELS[s] ?? s}
                </option>
              ))}
            </select>
            <button type="submit" aria-label={`Сохранить статус: ${pet.name}`}>
              Сохранить
            </button>
          </form>
          <form
            action={setPetTreatment}
            className="flex flex-wrap items-center gap-2"
          >
            <input type="hidden" name="petId" value={pet.id} />
            <input
              type="checkbox"
              id={`treatment-${pet.id}`}
              name="needsTreatment"
              defaultChecked={pet.needs_treatment_since !== null}
              aria-label={`Срочно нужна помощь с лечением: ${pet.name}`}
              aria-describedby={
                pet.needs_treatment_since
                  ? `treatment-note-${pet.id}`
                  : undefined
              }
            />
            <label htmlFor={`treatment-${pet.id}`}>
              Срочно нужна помощь с лечением
            </label>
            {pet.needs_treatment_since && (
              <span id={`treatment-note-${pet.id}`}>
                с{" "}
                {new Date(pet.needs_treatment_since).toLocaleDateString(
                  "ru-RU",
                  { day: "numeric", month: "long" },
                )}
                .{" "}
                {isTreatmentStale(pet.needs_treatment_since) &&
                  "Отметка стоит давно: проверьте, актуально ли."}
              </span>
            )}
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

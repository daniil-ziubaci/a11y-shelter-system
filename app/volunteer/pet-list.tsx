import { createClient } from "@/lib/supabase/server";
import { setPetStatus } from "@/app/volunteer/actions";
import { PET_STATUSES } from "@/lib/petStatuses";

export async function PetList({ shelterId }: { shelterId: string }) {
  const supabase = await createClient();
  const { data: pets, error } = await supabase
    .from("pets")
    .select("id, name, status")
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
        </li>
      ))}
    </ul>
  );
}

import { createClient } from "@/lib/supabase/server";

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
        <li key={pet.id}>{pet.name}</li>
      ))}
    </ul>
  );
}

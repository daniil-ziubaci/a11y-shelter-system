import { PetCard } from "@/components/PetCard";
import { createClient } from "@/lib/supabase/server";
import { toPet } from "@/lib/toPet";

export default async function Catalog() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("pets").select("*").in("status", ["ищет дом", "в процессе"]);;
  const pets = (data ?? []).map(toPet);
  return (
    <main className="flex flex-col gap-6 p-4 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-center">Ищу дом</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {pets.map((pet) => (
          <PetCard key={pet.id} pet={pet} />
        ))}
      </div>
    </main>
  );
}

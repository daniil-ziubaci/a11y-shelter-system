import { PetCard } from "@/components/PetCard";
import { createClient } from "@/lib/supabase/server";
import { toPet } from "@/lib/toPet";

export default async function Catalog({
  searchParams,
}: {
  searchParams: Promise<{ species?: string; sex?: string }>;
}) {
  const { species, sex } = await searchParams;
  const supabase = await createClient();
  let query = supabase
    .from("pets")
    .select("*")
    .in("status", ["ищет дом", "в процессе"]);
  if (species === "cat") {
    query = query.eq("species", "кошка");
  }
  if (species === "dog") {
    query = query.eq("species", "собака");
  }
  if (sex === "male") {
    query = query.eq("sex", "мальчик");
  }
  if (sex === "female") {
    query = query.eq("sex", "девочка");
  }
  const { data, error } = await query;
  if (error) {
    throw new Error("Не удалось загрузить питомцев из базы.");
  }
  const pets = (data ?? []).map(toPet);
  return (
    <main className="flex flex-col gap-6 p-4 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-center">Ищут дом</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {pets.map((pet) => (
          <PetCard key={pet.id} pet={pet} />
        ))}
      </div>
    </main>
  );
}

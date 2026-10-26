import { getShelter } from "@/lib/getShelter";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const shelter = await getShelter(slug);
  return {
    title: `Нужна помощь с лечением — ${shelter.name}`,
    description: `Животные приюта «${shelter.name}», которым сейчас нужна помощь с лечением.`,
  };
}

export default async function ShelterTreatmentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const shelter = await getShelter(slug);
  const supabase = await createClient();
  const { data: pets, error } = await supabase
    .from("pets")
    .select("id, name, needs_treatment_since")
    .eq("shelter_id", shelter.id)
    .in("status", ["ищет дом", "в процессе"])
    .not("needs_treatment_since", "is", null)
    .order("needs_treatment_since");

  if (error) {
    return (
      <main className="w-full flex flex-col gap-6 p-4 max-w-5xl mx-auto">
        <p role="alert">Не удалось загрузить список животных.</p>
      </main>
    );
  }
  return (
    <main className="w-full flex flex-col gap-6 p-4 max-w-5xl mx-auto">
      <h1>Нужна помощь с лечением</h1>
      {!pets || pets.length === 0 ? (
        <p>Сейчас никому из животных не нужна помощь с лечением.</p>
      ) : (
        <ul>
          {pets.map((pet) => (
            <li key={pet.id}>
              <Link href={`/catalog/${pet.id}`}>{pet.name}</Link>
              {pet.needs_treatment_since && (
                <p>
                  Срочно нужна помощь с лечением — с{" "}
                  {new Date(pet.needs_treatment_since).toLocaleDateString(
                    "ru-RU",
                    { day: "numeric", month: "long" },
                  )}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

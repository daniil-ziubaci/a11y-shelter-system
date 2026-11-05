import { EditPetForm } from "@/app/volunteer/pets/[id]/edit/edit-pet-form";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Редактирование животного",
  robots: { index: false },
};

export default async function EditPetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("shelter_members")
    .select("shelter_id")
    .limit(1)
    .maybeSingle();

  if (!membership) {
    return <p role="alert">Вы не состоите ни в одном приюте.</p>;
  }

  const { data: pet, error } = await supabase
    .from("pets")
    .select("*")
    .eq("id", id)
    .eq("shelter_id", membership.shelter_id)
    .maybeSingle();

  if (error) {
    return <p role="alert">Не удалось загрузить животное.</p>;
  }

  if (!pet) {
    return <p role="alert">Животное не найдено.</p>;
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 pb-8 pt-1">
      <h1 className="text-3xl font-bold sm:text-center">Редактирование: {pet.name}</h1>
      <EditPetForm pet={pet} />
    </main>
  );
}

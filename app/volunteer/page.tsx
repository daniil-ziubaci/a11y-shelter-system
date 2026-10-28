import { createClient } from "@/lib/supabase/server";
import { PetList } from "@/app/volunteer/pet-list";
import Link from "next/link";

export const metadata = {
  title: "Животные приюта",
  robots: { index: false },
};

export default async function VolunteerPage() {
  const supabase = await createClient();
  const { data: membership } = await supabase
    .from("shelter_members")
    .select("shelter_id, shelters(name)")
    .limit(1)
    .maybeSingle();

  return (
    <main className="w-full flex flex-col gap-6 p-4 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold">Животные приюта</h1>
      {membership ? (
        <>
          <p>Приют: {membership.shelters?.name}</p>
          <PetList shelterId={membership.shelter_id} />
          <Link href="/volunteer/pets/new">Добавить животное</Link>
        </>
      ) : (
        <p>Вы пока не состоите ни в одном приюте. Обратитесь к координатору.</p>
      )}
    </main>
  );
}

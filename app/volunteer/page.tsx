import { logout } from "@/app/volunteer/actions";
import { createClient } from "@/lib/supabase/server";
import { PetList } from "@/app/volunteer/pet-list";
import Link from "next/link";

export const metadata = {
  title: "Панель волонтёра",
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
    <main>
      <h1>Панель волонтёра</h1>
      {membership ? (
        <>
          <p>Приют: {membership.shelters?.name}</p>
          <h2 className="text-xl font-bold">Животные приюта</h2>
          <PetList shelterId={membership.shelter_id} />
          <Link href="/volunteer/pets/new">Добавить животное</Link>
        </>
      ) : (
        <p>Вы пока не состоите ни в одном приюте. Обратитесь к координатору.</p>
      )}
      <form action={logout}>
        <button type="submit">Выйти</button>
      </form>
    </main>
  );
}

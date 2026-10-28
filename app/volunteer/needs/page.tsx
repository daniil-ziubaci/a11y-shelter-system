import { createClient } from "@/lib/supabase/server";
import { NeedList } from "@/app/volunteer/need-list";
import Link from "next/link";

export const metadata = {
  title: "План закупок",
  robots: { index: false },
};

export default async function VolunteerNeedsPage() {
  const supabase = await createClient();
  const { data: membership } = await supabase
    .from("shelter_members")
    .select("shelter_id, shelters(name)")
    .limit(1)
    .maybeSingle();

  return (
    <main className="w-full flex flex-col gap-6 p-4 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold">План закупок</h1>
      {membership ? (
        <>
          <p>Приют: {membership.shelters?.name}</p>
          <NeedList shelterId={membership.shelter_id} />
          <Link href="/volunteer/needs/new">Добавить позицию</Link>
        </>
      ) : (
        <p>Вы пока не состоите ни в одном приюте. Обратитесь к координатору.</p>
      )}
    </main>
  );
}

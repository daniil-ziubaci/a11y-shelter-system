import { createClient } from "@/lib/supabase/server";
import { PetList } from "@/app/volunteer/pet-list";
import Link from "next/link";

export const metadata = {
  title: "Животные приюта",
  robots: { index: false },
};

export default async function VolunteerPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    species?: string;
    status?: string;
    sort?: string;
    treatment?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: membership } = await supabase
    .from("shelter_members")
    .select("shelter_id")
    .limit(1)
    .maybeSingle();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4 pt-4">
      <h1 className="text-3xl font-bold sm:text-center">Животные приюта</h1>
      {membership ? (
        <>
          <Link
            href="/volunteer/pets/new"
            className="flex min-h-10 items-center justify-center rounded-lg border border-(--border-strong) bg-(--surface) px-4 font-medium sm:self-center"
          >
            Добавить животное
          </Link>
          <PetList shelterId={membership.shelter_id} params={params} />
        </>
      ) : (
        <p>Вы пока не состоите ни в одном приюте. Обратитесь к координатору.</p>
      )}
    </main>
  );
}

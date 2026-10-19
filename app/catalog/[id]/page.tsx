import { createClient } from "@/lib/supabase/server";
import { toPet } from "@/lib/toPet";
import { formatAge } from "@/lib/formatAge";
import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "next/link";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("pets")
    .select("*")
    .eq("id", id)
    .single();
  if (!data) {
    return { title: "Животное не найдено" };
  }
  const pet = toPet(data);
  return {
    title: `${pet.name} ищет дом`,
    description: pet.description,
  };
}
export default async function PetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pets")
    .select("*")
    .eq("id", id)
    .single();
  if (error?.code === "PGRST116" || error?.code === "22P02") {
    notFound();
  }
  if (error) {
    throw new Error("Не удалось загрузить питомца из базы.");
  }
  const pet = toPet(data);
  return (
    <main className="flex flex-col gap-6 p-4 max-w-5xl mx-auto">
      <Link href="/catalog" className="inline-block py-2 underline">
        ← Все питомцы
      </Link>
      <h1 className="text-3xl font-bold">{pet.name}</h1>
      <div className="relative w-full max-w-md aspect-3/4">
        <Image
          src={pet.photo.url}
          alt={pet.photo.alt}
          fill
          sizes="(min-width: 448px) 448px, 100vw"
          className="object-cover"
        />
      </div>

      <dl className="flex flex-wrap gap-x-4">
        <div className="flex gap-1">
          <dt className="sr-only">Пол</dt>
          <dd>{pet.sex}</dd>
        </div>
        <div className="flex gap-1">
          <dt className="sr-only">Возраст</dt>
          <dd>{formatAge(pet.ageInMonths, pet.isAgeApproximate)}</dd>
        </div>
        <div className="flex gap-1">
          <dt className="sr-only">Вес</dt>
          <dd>{pet.weight} кг</dd>
        </div>
      </dl>
      <h2 className="text-xl font-bold">О питомце</h2>
      <p>{pet.description}</p>
      <h2 className="text-xl font-bold">Питание</h2>
      <p>{pet.diet}</p>
      <h2 className="text-xl font-bold">Здоровье</h2>
      <p>{pet.health}</p>
    </main>
  );
}

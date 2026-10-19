import { toPet } from "@/lib/toPet";
import { formatAge } from "@/lib/formatAge";
import Image from "next/image";
import Link from "next/link";
import { getAnimalWord } from "@/lib/animalWord";
import { getLifeStage } from "@/lib/lifeStage";
import { truncateText } from "@/lib/truncateText";
import { getPet } from "@/lib/getPet";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getPet(id);
  const pet = toPet(data);
  const word = getAnimalWord(
    pet.species,
    pet.sex,
    getLifeStage(pet.ageInMonths),
  );

  const shelterName = data.shelters?.name;
  const title = shelterName
    ? `${pet.name}, ${word} ищет дом — ${shelterName}`
    : `${pet.name}, ${word} ищет дом`;
  const description = truncateText(pet.description, 155);
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: pet.photo.url, alt: pet.photo.alt }],
    },
  };
}

export default async function PetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getPet(id);
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

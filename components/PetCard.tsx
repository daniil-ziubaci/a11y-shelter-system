import type { Pet } from "@/types/pet";
import { formatAge } from "@/lib/formatAge";
import Image from "next/image";
import Link from "next/link";

export function PetCard({ pet, eager = false }: { pet: Pet; eager?: boolean }) {
  return (
    <article className="p-4 border rounded-lg flex flex-col gap-4 relative focus-within:outline-2 focus-within:outline-offset-2 hover:bg-gray-900">
      <div className="relative aspect-3/4">
        <p className="absolute top-2 left-2 bg-white text-black px-2 py-1 rounded text-sm font-medium">
          {pet.status}
        </p>
        <Image
          src={pet.photo.url}
          alt={pet.photo.alt}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          loading={eager ? "eager" : "lazy"}
          className="object-cover bg-gray-100"
        />
      </div>
      <h2 className="text-xl font-bold">
        <Link
          href={`/catalog/${pet.id}`}
          className="after:absolute after:inset-0"
        >
          {pet.name}
        </Link>
      </h2>
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
      <p className="line-clamp-2">{pet.description}</p>
    </article>
  );
}

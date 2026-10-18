import type { Pet } from "@/types/pet";
import { formatAge } from "@/lib/formatAge";

export function PetCard({ pet }: { pet: Pet }) {
  return (
    <article className="p-4 border rounded-lg flex flex-col gap-4">
      <div className="relative">
        <p className="absolute top-2 left-2 bg-white text-black px-2 py-1 rounded text-sm font-medium">
          {pet.status}
        </p>
        <img
          src={pet.photo.url}
          alt={pet.photo.alt}
          className="w-full aspect-[3/4] object-cover bg-gray-100"
        />
      </div>
      <h2 className="text-xl font-bold">{pet.name}</h2>
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
      <dl>
        <dt className="font-medium">Питание</dt>
        <dd>{pet.diet}</dd>
        <dt className="font-medium">Здоровье</dt>
        <dd>{pet.health}</dd>
      </dl>
      <p>{pet.description}</p>
    </article>
  );
}

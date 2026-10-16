import type { Pet } from "@/types/pet";
import { formatAge } from "@/lib/formatAge";

export function PetCard({ pet }: { pet: Pet }) {
  return (
    <article className="p-4 border rounded-lg flex flex-col gap-4 w-[208px] shrink-0">
      <h2>{pet.name}</h2>
      <p>{pet.status}</p>
      <img src={pet.photo.url} alt={pet.photo.alt} className="w-full aspect-[3/4] object-cover bg-gray-100"/>
      <dl>
        <dt>Пол</dt>
        <dd>{pet.sex}</dd>
        <dt>Возраст</dt>
        <dd>{formatAge(pet.ageInMonths, pet.isAgeApproximate)}</dd>
        <dt>Вес</dt>
        <dd>{pet.weight} кг</dd>
        <dt>Питание</dt>
        <dd>{pet.diet}</dd>
        <dt>Здоровье</dt>
        <dd>{pet.health}</dd>
      </dl>
      <p>{pet.description}</p>
      <details>
        <summary>Прозрачность содержания</summary>
        <p>Расчёт появится позже</p>
      </details>
    </article>
  );
}

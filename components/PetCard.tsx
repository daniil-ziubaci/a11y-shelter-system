import type { Pet } from "@/types/pet";

export function PetCard({ pet }: { pet: Pet }) {
  return (
    <article>
      <h2>{pet.name}</h2>
      <p>{pet.status}</p>
      <dl>
        <dt>Пол</dt>
        <dd>{pet.sex}</dd>
        <dt>Вес</dt>
        <dd>{pet.weight} кг</dd>
        <dt>Питание</dt>
        <dd>{pet.diet}</dd>
        <dt>Здоровье</dt>
        <dd>{pet.health}</dd>
      </dl>
      <p>{pet.description}</p>
    </article>
  );
}

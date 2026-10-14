import type { Pet } from "@/types/pet";

export function PetCard({ pet }: { pet: Pet }) {
  return (
    <article>
      <h2>{pet.name}</h2>
      <p>{pet.status}</p>
    </article>
  );
}

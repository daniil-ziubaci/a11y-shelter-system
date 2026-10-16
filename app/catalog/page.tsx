import { PetCard } from "@/components/PetCard";
import type { Pet } from "@/types/pet";

const testPets: Pet[] = [
  {
    name: "Марс",
    species: "собака",
    sex: "самец",
    ageInMonths: 24,
    weight: 22.5,
    diet: "Сухой корм для крупных собак, 400г в сутки",
    description:
      "Активный и дружелюбный пес, знает базовые команды, отлично ладит с детьми.",
    health: "Здоров, привит, кастрирован. Ограничений по здоровью нет.",
    status: "ищет дом",
  },
  {
    name: "Мила",
    species: "кошка",
    sex: "самка",
    ageInMonths: 3,
    weight: 1.2,
    diet: "Влажный корм для котят, 4 раза в день малыми порциями",
    description:
      "Ласковая мурлыка, которую нашли в коробке у магазина. Очень игривая.",
    health: "Обработана от паразитов, готовится к первой вакцинации.",
    status: "в процессе",
  },
  {
    name: "Рекс",
    species: "собака",
    sex: "самец",
    ageInMonths: 60,
    weight: 14.0,
    diet: "Гипоаллергенный сухой корм, 250г в сутки",
    description:
      "Спокойный, рассудительный пес. Идеально подойдет для квартиры.",
    health: "Была легкая пищевая аллергия, сейчас полностью купирована диетой.",
    status: "пристроен",
  },
];

export default function Catalog() {
  return (
    <main>
      <h1>Ищу дом</h1>
      {testPets.map((pet) => (
        <PetCard key={pet.name} pet={pet} />
      ))}
    </main>
  );
}

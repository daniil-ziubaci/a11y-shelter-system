import { PetCard } from "@/components/PetCard";
import type { Pet } from "@/types/pet";

const testPets: Pet[] = [
  {
    name: "Марс",
    species: "собака",
    sex: "самец",
    ageInMonths: 25,
    isAgeApproximate: false,
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
    isAgeApproximate: true,
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
    isAgeApproximate: true,
    weight: 14.0,
    diet: "Гипоаллергенный сухой корм, 250г в сутки",
    description:
      "Спокойный, рассудительный пес. Идеально подойдет для квартиры.",
    health: "Была легкая пищевая аллергия, сейчас полностью купирована диетой.",
    status: "пристроен",
  },
  {
    name: "Том",
    species: "кошка",
    sex: "самец",
    ageInMonths: 82,
    isAgeApproximate: false,
    weight: 4.1,
    diet: "Натуральное питание: отварное мясо и субпродукты с овощами",
    description:
      "Тихий, независимый кот. Любит спать на подоконнике и наблюдать за птицами.",
    health: "Кастрирован, привит. Проблем со здоровьем не обнаружено.",
    status: "ищет дом",
  },
  {
    name: "Алиса",
    species: "собака",
    sex: "самка",
    ageInMonths: 2,
    isAgeApproximate: true,
    weight: 1.5,
    diet: "Размоченный сухой корм для щенков мелких пород, 5 раз в день",
    description:
      "Очаровательный и любопытный щенок. Активно познает мир, обожает грызть резиновые игрушки.",
    health:
      "Прошла первую обработку от паразитов, готовится к первой прививке.",
    status: "ищет дом",
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

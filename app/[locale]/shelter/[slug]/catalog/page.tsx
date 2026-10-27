import { PetCard } from "@/components/PetCard";
import { getShelter } from "@/lib/getShelter";
import { createClient } from "@/lib/supabase/server";
import { toPet } from "@/lib/toPet";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const shelter = await getShelter(slug);

  return {
    title: `Животные ищут дом — ${shelter.name}`,
    description: `Собаки и кошки из приюта «${shelter.name}» ищут дом. Фильтры по виду, полу и возрасту.`,
  };
}

export default async function Catalog({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ species?: string; sex?: string; age?: string }>;
}) {
  const { slug } = await params;
  const { species, sex, age } = await searchParams;
  const shelter = await getShelter(slug);

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  const sevenYearsAgo = new Date();
  sevenYearsAgo.setMonth(sevenYearsAgo.getMonth() - 84);
  const supabase = await createClient();

  let query = supabase
    .from("pets")
    .select("*")
    .eq("shelter_id", shelter.id)
    .in("status", ["ищет дом", "в процессе"])
    .order("created_at", { ascending: false })
    .order("name");

  if (species === "cat") {
    query = query.eq("species", "кошка");
  }
  if (species === "dog") {
    query = query.eq("species", "собака");
  }
  if (sex === "male") {
    query = query.eq("sex", "мальчик");
  }
  if (sex === "female") {
    query = query.eq("sex", "девочка");
  }
  if (age === "young") {
    query = query.gt("birth_date", twelveMonthsAgo.toISOString().slice(0, 10));
  }
  if (age === "adult") {
    query = query.lte("birth_date", twelveMonthsAgo.toISOString().slice(0, 10));
    query = query.gt("birth_date", sevenYearsAgo.toISOString().slice(0, 10));
  }
  if (age === "senior") {
    query = query.lte("birth_date", sevenYearsAgo.toISOString().slice(0, 10));
  }
  const { data, error } = await query;
  if (error) {
    throw new Error("Не удалось загрузить питомцев из базы.");
  }

  const pets = (data ?? []).map(toPet);

  function buildHref(
    newSpecies: string | undefined,
    newSex: string | undefined,
    newAge: string | undefined,
  ) {
    const params = new URLSearchParams();
    if (newSpecies) {
      params.set("species", newSpecies);
    }
    if (newSex) {
      params.set("sex", newSex);
    }
    if (newAge) {
      params.set("age", newAge);
    }

    const queryString = params.toString();
    const base = `/shelter/${slug}/catalog`;
    if (queryString) {
      return base + "?" + queryString;
    }
    return base;
  }

  return (
    <main className="w-full flex flex-col gap-6 p-4 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-center">Животные ищут дом</h1>
      <nav aria-label="Фильтры каталога">
        <fieldset>
          <legend>Вид</legend>
          <div className="flex flex-wrap gap-2">
            <Link
              href={buildHref(undefined, sex, age)}
              aria-current={species === undefined ? "true" : undefined}
              className={`px-3 py-2 ${species === undefined ? "font-bold" : ""}`}
            >
              Все
            </Link>
            <Link
              href={buildHref("dog", sex, age)}
              aria-current={species === "dog" ? "true" : undefined}
              className={`px-3 py-2 ${species === "dog" ? "font-bold" : ""}`}
            >
              Собаки
            </Link>
            <Link
              href={buildHref("cat", sex, age)}
              aria-current={species === "cat" ? "true" : undefined}
              className={`px-3 py-2 ${species === "cat" ? "font-bold" : ""}`}
            >
              Кошки
            </Link>
          </div>
        </fieldset>
        <fieldset>
          <legend>Пол</legend>
          <div className="flex flex-wrap gap-2">
            <Link
              href={buildHref(species, undefined, age)}
              aria-current={sex === undefined ? "true" : undefined}
              className={`px-3 py-2 ${sex === undefined ? "font-bold" : ""}`}
            >
              Все
            </Link>
            <Link
              href={buildHref(species, "male", age)}
              aria-current={sex === "male" ? "true" : undefined}
              className={`px-3 py-2 ${sex === "male" ? "font-bold" : ""}`}
            >
              Мальчики
            </Link>
            <Link
              href={buildHref(species, "female", age)}
              aria-current={sex === "female" ? "true" : undefined}
              className={`px-3 py-2 ${sex === "female" ? "font-bold" : ""}`}
            >
              Девочки
            </Link>
          </div>
        </fieldset>
        <fieldset>
          <legend>Возраст</legend>
          <div className="flex flex-wrap gap-2">
            <Link
              href={buildHref(species, sex, undefined)}
              aria-current={age === undefined ? "true" : undefined}
              className={`px-3 py-2 ${age === undefined ? "font-bold" : ""}`}
            >
              Все
            </Link>
            <Link
              href={buildHref(species, sex, "young")}
              aria-current={age === "young" ? "true" : undefined}
              className={`px-3 py-2 ${age === "young" ? "font-bold" : ""}`}
            >
              До 1 года
            </Link>
            <Link
              href={buildHref(species, sex, "adult")}
              aria-current={age === "adult" ? "true" : undefined}
              className={`px-3 py-2 ${age === "adult" ? "font-bold" : ""}`}
            >
              От 1 до 7 лет
            </Link>
            <Link
              href={buildHref(species, sex, "senior")}
              aria-current={age === "senior" ? "true" : undefined}
              className={`px-3 py-2 ${age === "senior" ? "font-bold" : ""}`}
            >
              От 7 лет
            </Link>
          </div>
        </fieldset>
      </nav>
      <p role="status">
        {pets.length === 0
          ? "Подходящих животных нет."
          : `Найдено животных: ${pets.length}`}
      </p>
      {pets.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pets.map((pet, index) => (
            <PetCard key={pet.id} pet={pet} slug={slug} eager={index < 3} />
          ))}
        </div>
      )}
    </main>
  );
}

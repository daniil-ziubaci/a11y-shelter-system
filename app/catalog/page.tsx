import { PetCard } from "@/components/PetCard";
import { createClient } from "@/lib/supabase/server";
import { toPet } from "@/lib/toPet";
import Link from "next/link";

export default async function Catalog({
  searchParams,
}: {
  searchParams: Promise<{ species?: string; sex?: string; age?: string }>;
}) {
  const { species, sex, age } = await searchParams;
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  const sevenYearsAgo = new Date();
  sevenYearsAgo.setMonth(sevenYearsAgo.getMonth() - 84);
  const supabase = await createClient();
  let query = supabase
    .from("pets")
    .select("*")
    .in("status", ["ищет дом", "в процессе"]);
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
    if (queryString) {
      return "/catalog?" + queryString;
    }
    return "/catalog";
  }
  return (
    <main className="flex flex-col gap-6 p-4 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-center">Ищут дом</h1>
      <nav aria-label="Фильтры каталога">
        <fieldset>
          <legend>Вид</legend>
          <Link
            href={buildHref(undefined, sex, age)}
            aria-current={species === undefined ? "true" : undefined}
            className={species === undefined ? "font-bold" : ""}
          >
            Все
          </Link>
          <Link
            href={buildHref("cat", sex, age)}
            aria-current={species === "cat" ? "true" : undefined}
            className={species === "cat" ? "font-bold" : ""}
          >
            Кошки
          </Link>
          <Link
            href={buildHref("dog", sex, age)}
            aria-current={species === "dog" ? "true" : undefined}
            className={species === "dog" ? "font-bold" : ""}
          >
            Собаки
          </Link>
        </fieldset>
        <fieldset>
          <legend>Пол</legend>
          <Link
            href={buildHref(species, undefined, age)}
            aria-current={sex === undefined ? "true" : undefined}
            className={sex === undefined ? "font-bold" : ""}
          >
            Все
          </Link>
          <Link
            href={buildHref(species, "male", age)}
            aria-current={sex === "male" ? "true" : undefined}
            className={sex === "male" ? "font-bold" : ""}
          >
            Мальчики
          </Link>
          <Link
            href={buildHref(species, "female", age)}
            aria-current={sex === "female" ? "true" : undefined}
            className={sex === "female" ? "font-bold" : ""}
          >
            Девочки
          </Link>
        </fieldset>
        <fieldset>
          <legend>Возраст</legend>
          <Link
            href={buildHref(species, sex, undefined)}
            aria-current={age === undefined ? "true" : undefined}
            className={age === undefined ? "font-bold" : ""}
          >
            Все
          </Link>
          <Link
            href={buildHref(species, sex, "young")}
            aria-current={age === "young" ? "true" : undefined}
            className={age === "young" ? "font-bold" : ""}
          >
            До 1 года
          </Link>
          <Link
            href={buildHref(species, sex, "adult")}
            aria-current={age === "adult" ? "true" : undefined}
            className={age === "adult" ? "font-bold" : ""}
          >
            От 1 до 7 лет
          </Link>
          <Link
            href={buildHref(species, sex, "senior")}
            aria-current={age === "senior" ? "true" : undefined}
            className={age === "senior" ? "font-bold" : ""}
          >
            От 7 лет
          </Link>
        </fieldset>
      </nav>
      {pets.length === 0 ? (
        <p role="status">Подходящих питомцев нет.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pets.map((pet) => (
            <PetCard key={pet.id} pet={pet} />
          ))}
        </div>
      )}
    </main>
  );
}

import { PetCard } from "@/components/PetCard";
import { getShelter } from "@/lib/getShelter";
import { createClient } from "@/lib/supabase/server";
import { toPet } from "@/lib/toPet";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { buildAlternates } from "@/lib/seo";
import { getSizeFromKey } from "@/lib/petSizes";
import { getStatusRank, PET_STATUS_TREATMENT, PUBLIC_PET_STATUSES } from "@/lib/petStatuses";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; locale: string }>;
  searchParams: Promise<{ mode?: string; group?: string }>;
}) {
  const { slug, locale } = await params;
  const { mode, group } = await searchParams;
  const isTreatment = mode === "treatment";
  const isBlocked = isTreatment && group === "blocked";
  const shelter = await getShelter(slug);
  const t = await getTranslations({ locale, namespace: "Catalog" });

  const prefix = isBlocked ? "treatmentBlocked" : "treatment";
  const titleKey = isTreatment ? `${prefix}Title` : "title";
  const descriptionKey = isTreatment ? `${prefix}Description` : "description";
  const query = isBlocked
    ? "?mode=treatment&group=blocked"
    : isTreatment
      ? "?mode=treatment"
      : "";

  return {
    title: t(titleKey, { shelter: shelter.name }),
    description: t(descriptionKey, { shelter: shelter.name }),
    alternates: buildAlternates(locale, `/shelter/${slug}/catalog${query}`),
  };
}

export default async function Catalog({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    species?: string;
    sex?: string;
    age?: string;
    size?: string;
    mode?: string;
    group?: string;
  }>;
}) {
  const { slug } = await params;
  const { species, sex, age, size, mode, group } = await searchParams;
  const isTreatment = mode === "treatment";
  const isBlocked = isTreatment && group === "blocked";
  const shelter = await getShelter(slug);
  const t = await getTranslations("Catalog");

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  const sevenYearsAgo = new Date();
  sevenYearsAgo.setMonth(sevenYearsAgo.getMonth() - 84);
  const supabase = await createClient();

  let query = supabase
    .from("pets")
    .select("*")
    .eq("shelter_id", shelter.id)
    .in("status", PUBLIC_PET_STATUSES)
    .order("created_at", { ascending: false })
    .order("name");

  if (isBlocked) {
    query = query.eq("status", PET_STATUS_TREATMENT);
  } else if (isTreatment) {
    query = query.not("needs_treatment_since", "is", null);
  }

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
  const sizeValue =
    species === "dog" && size ? getSizeFromKey(size) : undefined;
  if (sizeValue) {
    query = query.eq("size", sizeValue);
  }
  const { data, error } = await query;
  if (error) {
    throw new Error("Не удалось загрузить питомцев из базы.");
  }

  const pets = (data ?? [])
    .map(toPet)
    .sort((a, b) => getStatusRank(a.status) - getStatusRank(b.status));

  function buildHref(
    newSpecies: string | undefined,
    newSex: string | undefined,
    newAge: string | undefined,
    newSize: string | null | undefined = size,
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
    if (newSize && newSpecies === "dog") {
      params.set("size", newSize);
    }

    if (isTreatment) {
      params.set("mode", "treatment");
    }
    if (isBlocked) {
      params.set("group", "blocked");
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
      <h1 className="text-3xl font-bold text-center">
        {isBlocked
          ? t("treatmentBlockedHeading")
          : isTreatment
            ? t("treatmentHeading")
            : t("heading", { shelter: shelter.name })}
      </h1>
      {!isBlocked && !isTreatment && (
        <p className="-mt-3 text-center text-lg text-(--muted)">
          {t("subheading")}
        </p>
      )}
      {isTreatment && (
        <nav aria-label={t("treatmentGroupsLabel")}>
          <ul className="flex flex-wrap gap-2">
            <li>
              <Link
                href={`/shelter/${slug}/catalog?mode=treatment`}
                aria-current={!isBlocked ? "true" : undefined}
                className="inline-block px-3 py-2 transition-colors duration-200 hover:text-(--accent) motion-reduce:transition-none aria-current:font-semibold aria-current:text-(--accent)"
              >
                {t("treatmentGroupHelp")}
              </Link>
            </li>
            <li>
              <Link
                href={`/shelter/${slug}/catalog?mode=treatment&group=blocked`}
                aria-current={isBlocked ? "true" : undefined}
                className="inline-block px-3 py-2 transition-colors duration-200 hover:text-(--accent) motion-reduce:transition-none aria-current:font-semibold aria-current:text-(--accent)"
              >
                {t("treatmentGroupBlocked")}
              </Link>
            </li>
          </ul>
        </nav>
      )}
      <nav aria-label={t("filtersLabel")}>
        <fieldset>
          <legend>{t("species")}</legend>
          <div className="flex flex-wrap gap-2">
            <Link
              href={buildHref(undefined, sex, age)}
              aria-current={species === undefined ? "true" : undefined}
              className="px-3 py-2 transition-colors duration-200 hover:text-(--accent) motion-reduce:transition-none aria-current:font-semibold aria-current:text-(--accent)"
            >
              {t("all")}
            </Link>
            <Link
              href={buildHref("dog", sex, age)}
              aria-current={species === "dog" ? "true" : undefined}
              className="px-3 py-2 transition-colors duration-200 hover:text-(--accent) motion-reduce:transition-none aria-current:font-semibold aria-current:text-(--accent)"
            >
              {t("dogs")}
            </Link>
            <Link
              href={buildHref("cat", sex, age)}
              aria-current={species === "cat" ? "true" : undefined}
              className="px-3 py-2 transition-colors duration-200 hover:text-(--accent) motion-reduce:transition-none aria-current:font-semibold aria-current:text-(--accent)"
            >
              {t("cats")}
            </Link>
          </div>
        </fieldset>
        <fieldset>
          <legend>{t("sex")}</legend>
          <div className="flex flex-wrap gap-2">
            <Link
              href={buildHref(species, undefined, age)}
              aria-current={sex === undefined ? "true" : undefined}
              className="px-3 py-2 transition-colors duration-200 hover:text-(--accent) motion-reduce:transition-none aria-current:font-semibold aria-current:text-(--accent)"
            >
              {t("all")}
            </Link>
            <Link
              href={buildHref(species, "male", age)}
              aria-current={sex === "male" ? "true" : undefined}
              className="px-3 py-2 transition-colors duration-200 hover:text-(--accent) motion-reduce:transition-none aria-current:font-semibold aria-current:text-(--accent)"
            >
              {t("males")}
            </Link>
            <Link
              href={buildHref(species, "female", age)}
              aria-current={sex === "female" ? "true" : undefined}
              className="px-3 py-2 transition-colors duration-200 hover:text-(--accent) motion-reduce:transition-none aria-current:font-semibold aria-current:text-(--accent)"
            >
              {t("females")}
            </Link>
          </div>
        </fieldset>
        <fieldset>
          <legend>{t("age")}</legend>
          <div className="flex flex-wrap gap-2">
            <Link
              href={buildHref(species, sex, undefined)}
              aria-current={age === undefined ? "true" : undefined}
              className="px-3 py-2 transition-colors duration-200 hover:text-(--accent) motion-reduce:transition-none aria-current:font-semibold aria-current:text-(--accent)"
            >
              {t("all")}
            </Link>
            <Link
              href={buildHref(species, sex, "young")}
              aria-current={age === "young" ? "true" : undefined}
              className="px-3 py-2 transition-colors duration-200 hover:text-(--accent) motion-reduce:transition-none aria-current:font-semibold aria-current:text-(--accent)"
            >
              {t("young")}
            </Link>
            <Link
              href={buildHref(species, sex, "adult")}
              aria-current={age === "adult" ? "true" : undefined}
              className="px-3 py-2 transition-colors duration-200 hover:text-(--accent) motion-reduce:transition-none aria-current:font-semibold aria-current:text-(--accent)"
            >
              {t("adult")}
            </Link>
            <Link
              href={buildHref(species, sex, "senior")}
              aria-current={age === "senior" ? "true" : undefined}
              className="px-3 py-2 transition-colors duration-200 hover:text-(--accent) motion-reduce:transition-none aria-current:font-semibold aria-current:text-(--accent)"
            >
              {t("senior")}
            </Link>
          </div>
        </fieldset>
        {species === "dog" && (
          <fieldset>
            <legend>{t("size")}</legend>
            <div className="flex flex-wrap gap-2">
              <Link
                href={buildHref(species, sex, age, null)}
                aria-current={!size ? "true" : undefined}
                className="px-3 py-2 transition-colors duration-200 hover:text-(--accent) motion-reduce:transition-none aria-current:font-semibold aria-current:text-(--accent)"
              >
                {t("all")}
              </Link>
              <Link
                href={buildHref(species, sex, age, "small")}
                aria-current={size === "small" ? "true" : undefined}
                className="px-3 py-2 transition-colors duration-200 hover:text-(--accent) motion-reduce:transition-none aria-current:font-semibold aria-current:text-(--accent)"
              >
                {t("sizeSmall")}
              </Link>
              <Link
                href={buildHref(species, sex, age, "medium")}
                aria-current={size === "medium" ? "true" : undefined}
                className="px-3 py-2 transition-colors duration-200 hover:text-(--accent) motion-reduce:transition-none aria-current:font-semibold aria-current:text-(--accent)"
              >
                {t("sizeMedium")}
              </Link>
              <Link
                href={buildHref(species, sex, age, "large")}
                aria-current={size === "large" ? "true" : undefined}
                className="px-3 py-2 transition-colors duration-200 hover:text-(--accent) motion-reduce:transition-none aria-current:font-semibold aria-current:text-(--accent)"
              >
                {t("sizeLarge")}
              </Link>
            </div>
          </fieldset>
        )}
      </nav>
      <p role="status">
        {pets.length === 0 ? t("none") : t("found", { count: pets.length })}
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

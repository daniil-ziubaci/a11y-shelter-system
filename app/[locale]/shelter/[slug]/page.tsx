import { getShelter } from "@/lib/getShelter";
import { PetCard } from "@/components/PetCard";
import { createClient } from "@/lib/supabase/server";
import { toPet } from "@/lib/toPet";
import {
  PET_STATUS_ADOPTED,
  PET_STATUS_LOOKING,
  PUBLIC_PET_STATUSES,
} from "@/lib/petStatuses";
import { buildAlternates } from "@/lib/seo";
import { Link } from "@/i18n/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { getUnitKey } from "@/lib/needUnits";
import { getCategoryKey } from "@/lib/needCategories";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  const shelter = await getShelter(slug);
  const t = await getTranslations({ locale, namespace: "Home" });
  return {
    title: t("title", { shelter: shelter.name }),
    description: t("description", { shelter: shelter.name }),
    alternates: buildAlternates(locale, `/shelter/${slug}`),
  };
}

export default async function ShelterHomePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const shelter = await getShelter(slug);
  const t = await getTranslations("Home");

  const tn = await getTranslations("Needs");
  const format = await getFormatter();

  const supabase = await createClient();
  const { data: lookingData, error: lookingError } = await supabase
    .from("pets")
    .select("*")
    .eq("shelter_id", shelter.id)
    .eq("status", PET_STATUS_LOOKING)
    .is("needs_treatment_since", null)
    .order("created_at", { ascending: false })
    .order("name")
    .limit(4);
  const lookingPets = (lookingData ?? []).map(toPet);

  const { data: treatmentData, error: treatmentError } = await supabase
    .from("pets")
    .select("*")
    .eq("shelter_id", shelter.id)
    .in("status", PUBLIC_PET_STATUSES)
    .not("needs_treatment_since", "is", null)
    .order("needs_treatment_since", { ascending: false })
    .order("name")
    .limit(3);
  const treatmentPets = (treatmentData ?? []).map(toPet);

  const { data: urgentData, error: urgentError } = await supabase
    .from("purchase_items")
    .select("id, name, category, unit, remaining")
    .eq("shelter_id", shelter.id)
    .gt("remaining", 0)
    .eq("is_urgent", true)
    .order("created_at")
    .order("id")
    .limit(5);
  const urgentItems = urgentData ?? [];

  function countPets(statuses: string[]) {
    return supabase
      .from("pets")
      .select("id", { count: "exact", head: true })
      .eq("shelter_id", shelter.id)
      .in("status", statuses);
  }
  const [totalResult, lookingResult, adoptedResult] = await Promise.all([
    countPets(PUBLIC_PET_STATUSES),
    countPets([PET_STATUS_LOOKING]),
    countPets([PET_STATUS_ADOPTED]),
  ]);
  const statsError =
    totalResult.error || lookingResult.error || adoptedResult.error;
  const totalCount = totalResult.count ?? 0;
  const lookingCount = lookingResult.count ?? 0;
  const adoptedCount = adoptedResult.count ?? 0;

  return (
    <main className="w-full flex flex-col gap-10 p-4 max-w-5xl mx-auto">
      <section className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-3xl font-bold">
          {t("heading", { shelter: shelter.name })}
        </h1>
        <p className="max-w-2xl text-lg text-(--muted)">{t("intro")}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href={`/shelter/${slug}/catalog`}
            className="inline-flex min-h-11 items-center rounded-full bg-(--accent) px-5 text-lg font-semibold text-(--accent-contrast)"
          >
            {t("findHome")}
          </Link>
          <Link
            href={`/shelter/${slug}/needs`}
            className="inline-flex min-h-11 items-center rounded-full border border-(--accent) px-5 text-lg font-semibold text-(--accent) transition-colors duration-200 hover:bg-(--hover) motion-reduce:transition-none"
          >
            {t("howToHelp")}
          </Link>
        </div>
      </section>

      {lookingError && <p role="alert">{t("loadError")}</p>}
      {lookingPets.length > 0 && (
        <section
          aria-labelledby="looking-heading"
          className="flex flex-col gap-4"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="looking-heading" className="text-2xl font-bold">
              {t("lookingHeading")}
            </h2>
            <Link
              href={`/shelter/${slug}/catalog`}
              className="group inline-flex min-h-11 items-center gap-1.5 font-medium text-(--accent) transition-colors hover:text-(--foreground) motion-reduce:transition-none"
            >
              {t("allCatalog")}
              <span
                aria-hidden="true"
                className="inline-block transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none"
              >
                →
              </span>
            </Link>
          </div>
          <ul
            role="list"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {lookingPets.map((pet, index) => (
              <PetCard key={pet.id} pet={pet} slug={slug} eager={index < 3} />
            ))}
          </ul>
        </section>
      )}

      {treatmentError && <p role="alert">{t("loadError")}</p>}
      {treatmentPets.length > 0 && (
        <section
          aria-labelledby="treatment-heading"
          className="flex flex-col gap-4"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="treatment-heading" className="text-2xl font-bold">
              {t("treatmentHeading")}
            </h2>
            <Link
              href={`/shelter/${slug}/catalog?mode=treatment`}
              className="group inline-flex min-h-11 items-center gap-1.5 font-medium text-(--accent) transition-colors hover:text-(--foreground) motion-reduce:transition-none"
            >
              {t("allTreatment")}
              <span
                aria-hidden="true"
                className="inline-block transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none"
              >
                →
              </span>
            </Link>
          </div>
          <ul
            role="list"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {treatmentPets.map((pet) => (
              <PetCard key={pet.id} pet={pet} slug={slug} eager={false} />
            ))}
          </ul>
        </section>
      )}

      {urgentError && <p role="alert">{t("loadError")}</p>}
      {urgentItems.length > 0 && (
        <section
          aria-labelledby="urgent-heading"
          className="flex flex-col gap-4"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="urgent-heading" className="text-2xl font-bold">
              {t("urgentHeading")}
            </h2>
            <Link
              href={`/shelter/${slug}/needs?urgent=1`}
              className="group inline-flex min-h-11 items-center gap-1.5 font-medium text-(--accent) transition-colors hover:text-(--foreground) motion-reduce:transition-none"
            >
              {t("allUrgent")}
              <span
                aria-hidden="true"
                className="inline-block transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none"
              >
                →
              </span>
            </Link>
          </div>
          <ul
            role="list"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {urgentItems.map((item) => {
              const categoryKey = getCategoryKey(item.category);
              const unitKey = getUnitKey(item.unit);
              return (
                <li
                  key={item.id}
                  className="group relative flex min-w-0 flex-col gap-3 rounded-2xl border border-(--danger) bg-(--surface) p-4 shadow-sm transition duration-300 ease-out hover:shadow-2xl focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-(--focus) motion-safe:hover:-translate-y-1.5"
                >
                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="min-w-0 text-lg font-bold wrap-anywhere">
                        {item.name}
                      </h3>
                      <p
                        aria-hidden="true"
                        className="shrink-0 rounded-full bg-(--danger-soft) px-3 py-0.5 text-sm font-semibold text-(--danger)"
                      >
                        🔥 {tn("urgent")}
                      </p>
                    </div>
                    <p className="text-(--muted)">
                      {categoryKey
                        ? tn(`categories.${categoryKey}`)
                        : item.category}
                    </p>
                  </div>
                  <div className="mt-auto flex flex-col gap-3">
                    <p className="text-lg font-bold">
                      {tn("remaining", {
                        amount: format.number(item.remaining),
                        unit: unitKey ? tn(`units.${unitKey}`) : item.unit,
                      })}
                    </p>
                    <a
                      href="#footer-contact-heading"
                      aria-label={tn("helpLabel", { name: item.name })}
                      className="flex min-h-11 items-center justify-center self-start rounded-full bg-(--accent) px-5 text-lg font-semibold text-(--accent-contrast) sm:after:absolute sm:after:inset-0"
                    >
                      {tn("help")}
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {statsError && <p role="alert">{t("loadError")}</p>}
      {!statsError && totalCount > 0 && (
        <section
          aria-labelledby="stats-heading"
          className="flex flex-col gap-4"
        >
          <h2 id="stats-heading" className="text-2xl font-bold">
            {t("statsHeading")}
          </h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col-reverse rounded-2xl border border-(--border) bg-(--surface) p-4">
              <dt className="text-(--muted)">{t("statsTotal")}</dt>
              <dd className="text-3xl font-bold">
                {format.number(totalCount)}
              </dd>
            </div>
            <div className="flex flex-col-reverse rounded-2xl border border-(--border) bg-(--surface) p-4">
              <dt className="text-(--muted)">{t("statsLooking")}</dt>
              <dd className="text-3xl font-bold">
                {format.number(lookingCount)}
              </dd>
            </div>
            {adoptedCount > 0 && (
              <div className="flex flex-col-reverse rounded-2xl border border-(--border) bg-(--surface) p-4">
                <dt className="text-(--muted)">{t("statsAdopted")}</dt>
                <dd className="text-3xl font-bold">
                  {format.number(adoptedCount)}
                </dd>
              </div>
            )}
          </dl>
        </section>
      )}
    </main>
  );
}

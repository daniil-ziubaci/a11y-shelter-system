import { PetCard } from "@/components/PetCard";
import { getShelter } from "@/lib/getShelter";
import { createClient } from "@/lib/supabase/server";
import { toPet } from "@/lib/toPet";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import {
  buildAlternates,
  buildSocialMetadata,
  getShelterPreviewImage,
} from "@/lib/seo";
import { getSizeFromKey } from "@/lib/petSizes";
import { PET_STATUS_TREATMENT, PUBLIC_PET_STATUSES } from "@/lib/petStatuses";
import { CATALOG_PAGE_SIZE, parsePage } from "@/lib/parsePage";
import { redirect } from "@/i18n/navigation";
import { Fragment } from "react";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; locale: string }>;
  searchParams: Promise<{
    mode?: string;
    group?: string;
    q?: string;
    page?: string;
  }>;
}) {
  const { slug, locale } = await params;
  const { mode, group, q, page: rawPage } = await searchParams;
  const page = parsePage(rawPage);
  const isTreatment = mode === "treatment";
  const isBlocked = isTreatment && group === "blocked";
  const shelter = await getShelter(slug, locale);
  const t = await getTranslations({ locale, namespace: "Catalog" });

  const prefix = isBlocked ? "treatmentBlocked" : "treatment";
  const titleKey = isTreatment ? `${prefix}Title` : "title";
  const descriptionKey = isTreatment ? `${prefix}Description` : "description";
  const query = isBlocked
    ? "?mode=treatment&group=blocked"
    : isTreatment
      ? "?mode=treatment"
      : "";

  const pageQuery = page > 1 ? `${query ? "&" : "?"}page=${page}` : "";
  const baseTitle = t(titleKey, { shelter: shelter.name });

  const title =
    page > 1 ? t("titleWithPage", { title: baseTitle, page }) : baseTitle;
  const description = t(descriptionKey, { shelter: shelter.name });
  const path = `/shelter/${slug}/catalog${query}${pageQuery}`;

  return {
    title,
    description,
    alternates: buildAlternates(locale, path),
    ...buildSocialMetadata({
      locale,
      path,
      title,
      description,
      siteName: shelter.name,
      image: getShelterPreviewImage(shelter),
    }),
    ...(q?.trim() ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function Catalog({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; locale: string }>;
  searchParams: Promise<{
    species?: string;
    sex?: string;
    age?: string;
    size?: string;
    mode?: string;
    group?: string;
    q?: string;
    page?: string;
  }>;
}) {
  const { slug, locale } = await params;
  const {
    species,
    sex: rawSex,
    age: rawAge,
    size: rawSize,
    mode,
    group,
    q,
    page: rawPage,
  } = await searchParams;
  const isTreatment = mode === "treatment";
  const sex = isTreatment ? undefined : rawSex;
  const age = isTreatment ? undefined : rawAge;
  const size = isTreatment ? undefined : rawSize;
  const isBlocked = isTreatment && group === "blocked";
  const shelter = await getShelter(slug, locale);
  const t = await getTranslations("Catalog");
  const search = (q ?? "").trim().slice(0, 50);
  const requestedPage = parsePage(rawPage);

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  const sevenYearsAgo = new Date();
  sevenYearsAgo.setMonth(sevenYearsAgo.getMonth() - 84);
  const supabase = await createClient();

  function buildQuery(head: boolean) {
    let query = supabase
      .from("pets")
      .select("*", { count: "exact", head })
      .eq("shelter_id", shelter.id)
      .in("status", PUBLIC_PET_STATUSES);

    if (isBlocked) {
      query = query
        .eq("status", PET_STATUS_TREATMENT)
        .order("status_changed_at", { ascending: true })
        .order("name");
    } else if (isTreatment) {
      query = query
        .not("needs_treatment_since", "is", null)
        .order("needs_treatment_since", { ascending: true })
        .order("name");
    } else {
      query = query
        .order("status_rank")
        .order("created_at", { ascending: false })
        .order("name");
    }

    if (search) {
      const pattern = search.replace(/[\\%_]/g, "\\$&");
      query = query.ilike("name_search", `%${pattern}%`);
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
      query = query.gt(
        "birth_date",
        twelveMonthsAgo.toISOString().slice(0, 10),
      );
    }
    if (age === "adult") {
      query = query.lte(
        "birth_date",
        twelveMonthsAgo.toISOString().slice(0, 10),
      );
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
    return query;
  }
  const { count, error: countError } = await buildQuery(true);
  if (countError) {
    throw new Error("Не удалось загрузить питомцев из базы.");
  }
  const total = count ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE));
  if (requestedPage > lastPage) {
    const keep = Object.fromEntries(
      Object.entries({
        species,
        sex: rawSex,
        age: rawAge,
        size: rawSize,
        mode,
        group,
        q,
      }).filter(([, value]) => value),
    ) as Record<string, string>;
    redirect({
      href: {
        pathname: `/shelter/${slug}/catalog`,
        query: { ...keep, ...(lastPage > 1 && { page: String(lastPage) }) },
      },
      locale,
    });
  }
  const from = (requestedPage - 1) * CATALOG_PAGE_SIZE;
  const { data, error } = await buildQuery(false).range(
    from,
    from + CATALOG_PAGE_SIZE - 1,
  );
  if (error) {
    throw new Error("Не удалось загрузить питомцев из базы.");
  }

  const pets = (data ?? []).map((row) => toPet(row, locale));

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

    if (search) {
      params.set("q", search);
    }

    const queryString = params.toString();
    const base = `/shelter/${slug}/catalog`;
    if (queryString) {
      return base + "?" + queryString;
    }
    return base;
  }

  function buildPageHref(page: number) {
    const href = buildHref(species, sex, age);
    if (page === 1) {
      return href;
    }
    return href + (href.includes("?") ? "&" : "?") + "page=" + page;
  }

  const pageNumbers = Array.from({ length: lastPage }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === lastPage || Math.abs(n - requestedPage) <= 1,
  );

  const filterLink =
    "inline-flex min-h-11 items-center rounded-full border border-transparent bg-(--hover) px-3 py-2 transition-colors duration-200 hover:border-(--accent) motion-reduce:transition-none aria-current:border-(--accent) aria-current:bg-(--accent) aria-current:font-semibold aria-current:text-(--accent-contrast)";
  const pageLink = `${filterLink} aria-[current=page]:border-(--accent) aria-[current=page]:bg-(--accent) aria-[current=page]:font-semibold aria-[current=page]:text-(--accent-contrast)`;

  const searchPart =
    (search ? `&q=${encodeURIComponent(search)}` : "") +
    (species === "cat" || species === "dog" ? `&species=${species}` : "");
  const treatmentHelpHref = `/shelter/${slug}/catalog?mode=treatment${searchPart}`;
  const treatmentBlockedHref = `/shelter/${slug}/catalog?mode=treatment&group=blocked${searchPart}`;

  return (
    <main className="w-full flex flex-col gap-6 px-4 pb-10 pt-4 max-w-5xl mx-auto">
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
        <p className="-mt-3 text-center text-lg text-(--muted)">
          {t.rich(isBlocked ? "treatmentIntroBlocked" : "treatmentIntroHelp", {
            link: (chunks) => (
              <Link
                href="#footer-contact-heading"
                className="font-semibold text-(--accent) underline underline-offset-2"
              >
                {chunks}
              </Link>
            ),
          })}
        </p>
      )}
      <div className="flex flex-col gap-4 rounded-2xl border border-(--border) bg-(--surface) p-4 shadow-sm">
        <form
          role="search"
          className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-0"
        >
          <label
            htmlFor="catalog-search"
            className="text-sm font-semibold text-(--muted) sm:w-24 sm:text-base"
          >
            {t("searchLabel")}
          </label>
          <div className="flex min-w-0 max-w-95 flex-1 gap-2">
            <input
              id="catalog-search"
              type="search"
              name="q"
              defaultValue={search}
              maxLength={50}
              className="min-h-10 min-w-0 flex-1 rounded-full border border-(--border-strong) bg-(--surface) px-4 focus-visible:outline-(--accent)! focus-visible:outline-offset-0!"
            />
            <button
              type="submit"
              className="min-h-10 cursor-pointer rounded-full bg-(--accent) px-4 text-(--accent-contrast) hover:shadow-md"
            >
              {t("searchButton")}
            </button>
          </div>
          {species && <input type="hidden" name="species" value={species} />}
          {sex && <input type="hidden" name="sex" value={sex} />}
          {age && <input type="hidden" name="age" value={age} />}
          {species === "dog" && size && (
            <input type="hidden" name="size" value={size} />
          )}
          {isTreatment && <input type="hidden" name="mode" value="treatment" />}
          {isBlocked && <input type="hidden" name="group" value="blocked" />}
        </form>

        <nav aria-label={t("filtersLabel")}>
          <div className="flex flex-col gap-4">
            <fieldset className="min-w-0">
              <legend className="mb-2 cursor-default text-sm font-semibold text-(--muted) sm:float-left sm:mb-0 sm:w-24 sm:pt-2.5 sm:text-base">
                {t("species")}
              </legend>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={buildHref(undefined, sex, age)}
                  aria-current={species === undefined ? "true" : undefined}
                  className={filterLink}
                >
                  {t("all")}
                </Link>
                <Link
                  href={buildHref("dog", sex, age)}
                  aria-current={species === "dog" ? "true" : undefined}
                  className={filterLink}
                >
                  {t("dogs")}
                </Link>
                <Link
                  href={buildHref("cat", sex, age)}
                  aria-current={species === "cat" ? "true" : undefined}
                  className={filterLink}
                >
                  {t("cats")}
                </Link>
              </div>
            </fieldset>
            {isTreatment && (
              <fieldset className="min-w-0">
                <legend className="mb-2 cursor-default text-sm font-semibold text-(--muted) sm:float-left sm:mb-0 sm:w-24 sm:pt-2.5 sm:text-base">
                  {t("treatmentLegend")}
                </legend>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={treatmentHelpHref}
                    aria-current={!isBlocked ? "true" : undefined}
                    className={filterLink}
                  >
                    {t("treatmentGroupHelp")}
                  </Link>
                  <Link
                    href={treatmentBlockedHref}
                    aria-current={isBlocked ? "true" : undefined}
                    className={filterLink}
                  >
                    {t("treatmentGroupBlocked")}
                  </Link>
                </div>
              </fieldset>
            )}
            {!isTreatment && (
              <>
                <fieldset className="min-w-0">
                  <legend className="mb-2 cursor-default text-sm font-semibold text-(--muted) sm:float-left sm:mb-0 sm:w-24 sm:pt-2.5 sm:text-base">
                    {t("sex")}
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={buildHref(species, undefined, age)}
                      aria-current={sex === undefined ? "true" : undefined}
                      className={filterLink}
                    >
                      {t("all")}
                    </Link>
                    <Link
                      href={buildHref(species, "male", age)}
                      aria-current={sex === "male" ? "true" : undefined}
                      className={filterLink}
                    >
                      {t("males")}
                    </Link>
                    <Link
                      href={buildHref(species, "female", age)}
                      aria-current={sex === "female" ? "true" : undefined}
                      className={filterLink}
                    >
                      {t("females")}
                    </Link>
                  </div>
                </fieldset>
                <fieldset className="min-w-0">
                  <legend className="mb-2 cursor-default text-sm font-semibold text-(--muted) sm:float-left sm:mb-0 sm:w-24 sm:pt-2.5 sm:text-base">
                    {t("age")}
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={buildHref(species, sex, undefined)}
                      aria-current={age === undefined ? "true" : undefined}
                      className={filterLink}
                    >
                      {t("all")}
                    </Link>
                    <Link
                      href={buildHref(species, sex, "young")}
                      aria-current={age === "young" ? "true" : undefined}
                      className={filterLink}
                    >
                      {t("young")}
                    </Link>
                    <Link
                      href={buildHref(species, sex, "adult")}
                      aria-current={age === "adult" ? "true" : undefined}
                      className={filterLink}
                    >
                      {t("adult")}
                    </Link>
                    <Link
                      href={buildHref(species, sex, "senior")}
                      aria-current={age === "senior" ? "true" : undefined}
                      className={filterLink}
                    >
                      {t("senior")}
                    </Link>
                  </div>
                </fieldset>
                {species === "dog" && (
                  <fieldset className="min-w-0">
                    <legend className="mb-2 cursor-default text-sm font-semibold text-(--muted) sm:float-left sm:mb-0 sm:w-24 sm:pt-2.5 sm:text-base">
                      {t("size")}
                    </legend>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={buildHref(species, sex, age, null)}
                        aria-current={!size ? "true" : undefined}
                        className={filterLink}
                      >
                        {t("all")}
                      </Link>
                      <Link
                        href={buildHref(species, sex, age, "small")}
                        aria-current={size === "small" ? "true" : undefined}
                        className={filterLink}
                      >
                        {t("sizeSmall")}
                      </Link>
                      <Link
                        href={buildHref(species, sex, age, "medium")}
                        aria-current={size === "medium" ? "true" : undefined}
                        className={filterLink}
                      >
                        {t("sizeMedium")}
                      </Link>
                      <Link
                        href={buildHref(species, sex, age, "large")}
                        aria-current={size === "large" ? "true" : undefined}
                        className={filterLink}
                      >
                        {t("sizeLarge")}
                      </Link>
                    </div>
                  </fieldset>
                )}
              </>
            )}
          </div>
        </nav>
      </div>

      <p role="status" className="-mb-1 text-(--muted)">
        {total === 0
          ? t("none")
          : total <= CATALOG_PAGE_SIZE
            ? t("found", { count: total })
            : t("shown", { from: from + 1, to: from + pets.length, total })}
      </p>
      {pets.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pets.map((pet, index) => (
            <PetCard key={pet.id} pet={pet} slug={slug} eager={index < 3} />
          ))}
        </div>
      )}
      {lastPage > 1 && (
        <nav
          aria-label={t("paginationLabel")}
          className="flex flex-wrap items-center justify-center gap-2"
        >
          {requestedPage > 1 && (
            <Link href={buildPageHref(requestedPage - 1)} className={pageLink}>
              {t("previousPage")}
            </Link>
          )}
          {pageNumbers.map((n, i) => (
            <Fragment key={n}>
              {i > 0 && n - pageNumbers[i - 1] > 1 && (
                <span aria-hidden="true">…</span>
              )}
              <Link
                href={buildPageHref(n)}
                aria-current={n === requestedPage ? "page" : undefined}
                aria-label={t("pageLabel", { page: n })}
                className={pageLink}
              >
                {n}
              </Link>
            </Fragment>
          ))}
          {requestedPage < lastPage && (
            <Link href={buildPageHref(requestedPage + 1)} className={pageLink}>
              {t("nextPage")}
            </Link>
          )}
        </nav>
      )}
    </main>
  );
}

import { getShelter } from "@/lib/getShelter";
import { ContentLanguageNote } from "@/components/ContentLanguageNote";
import { toContentLanguage } from "@/lib/contentLanguage";
import { NEED_CATEGORIES, getCategoryKey } from "@/lib/needCategories";
import { getUnitKey } from "@/lib/needUnits";
import {
  buildAlternates,
  buildSocialMetadata,
  getShelterPreviewImage,
} from "@/lib/seo";
import { createClient } from "@/lib/supabase/server";
import { getFormatter, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { NEEDS_PAGE_SIZE, parseShown } from "@/lib/parsePage";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  const shelter = await getShelter(slug);
  const t = await getTranslations({ locale, namespace: "Needs" });
  const title = t("title", { shelter: shelter.name });
  const description = t("description", { shelter: shelter.name });
  return {
    title,
    description,
    alternates: buildAlternates(locale, `/shelter/${slug}/needs`),
    ...buildSocialMetadata({
      locale,
      path: `/shelter/${slug}/needs`,
      title,
      description,
      siteName: shelter.name,
      image: getShelterPreviewImage(shelter),
    }),
  };
}

export default async function ShelterNeedsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    category?: string;
    shown?: string;
    urgent?: string;
  }>;
}) {
  const { slug } = await params;
  const {
    category: rawCategory,
    shown: rawShown,
    urgent: rawUrgent,
  } = await searchParams;
  const urgentOnly = rawUrgent === "1";
  const category =
    !urgentOnly && NEED_CATEGORIES.includes(rawCategory ?? "")
      ? rawCategory
      : undefined;
  const shown = parseShown(rawShown);

  const shelter = await getShelter(slug);
  const t = await getTranslations("Needs");
  const contentLanguage = toContentLanguage(shelter.content_language);
  const format = await getFormatter();
  const supabase = await createClient();
  function buildQuery(head: boolean) {
    let query = supabase
      .from("purchase_items")
      .select("id, name, category, unit, remaining, is_urgent", {
        count: "exact",
        head,
      })
      .eq("shelter_id", shelter.id)
      .gt("remaining", 0);
    if (category) {
      query = query.eq("category", category);
    }
    if (urgentOnly) {
      query = query.eq("is_urgent", true);
    }
    return query;
  }

  const { count, error: countError } = await buildQuery(true);
  const total = count ?? 0;
  const { data: items, error } = await buildQuery(false)
    .order("is_urgent", { ascending: false })
    .order("created_at")
    .order("id")
    .range(0, shown - 1);

  function buildHref(
    nextCategory?: string,
    nextShown = NEEDS_PAGE_SIZE,
    nextUrgent = false,
  ) {
    const query = new URLSearchParams();
    if (nextUrgent) {
      query.set("urgent", "1");
    } else if (nextCategory) {
      query.set("category", nextCategory);
    }
    if (nextShown > NEEDS_PAGE_SIZE) {
      query.set("shown", String(nextShown));
    }
    const queryString = query.toString();
    const base = `/shelter/${slug}/needs`;
    return queryString ? `${base}?${queryString}` : base;
  }

  const filterLink =
    "inline-flex min-h-11 items-center rounded-full border border-transparent bg-(--hover) px-3 py-2 transition-colors duration-200 hover:border-(--accent) motion-reduce:transition-none aria-current:border-(--accent) aria-current:bg-(--accent) aria-current:font-semibold aria-current:text-(--accent-contrast)";

  if (error || countError) {
    return (
      <main className="w-full flex flex-col gap-6 p-4 max-w-5xl mx-auto">
        <p role="alert">{t("loadError")}</p>
      </main>
    );
  }

  return (
    <main className="w-full flex flex-col gap-6 p-4 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-center">{t("heading")}</h1>
      <p className="-mt-3 text-center text-lg text-(--muted)">
        {t.rich("intro", {
          treatment: (chunks) => (
            <Link
              href={`/shelter/${slug}/catalog?mode=treatment`}
              className="font-semibold text-(--accent) underline underline-offset-2"
            >
              {chunks}
            </Link>
          ),
          projects: (chunks) => (
            <Link
              href={`/shelter/${slug}/projects`}
              className="font-semibold text-(--accent) underline underline-offset-2"
            >
              {chunks}
            </Link>
          ),
        })}
      </p>
      <nav aria-label={t("filtersLabel")}>
        <div className="flex flex-wrap gap-2">
          <Link
            href={buildHref()}
            aria-current={
              category === undefined && !urgentOnly ? "true" : undefined
            }
            className={filterLink}
          >
            {t("all")}
          </Link>
          <Link
            href={buildHref(undefined, NEEDS_PAGE_SIZE, true)}
            aria-current={urgentOnly ? "true" : undefined}
            className={filterLink}
          >
            {t("urgentFilter")}
          </Link>
          {NEED_CATEGORIES.map((name) => {
            const key = getCategoryKey(name);
            return (
              <Link
                key={name}
                href={buildHref(name)}
                aria-current={category === name ? "true" : undefined}
                className={filterLink}
              >
                {key ? t(`categories.${key}`) : name}
              </Link>
            );
          })}
        </div>
      </nav>
      {total > 0 && (
        <p role="status" className="-mb-1 text-(--muted)">
          {total > (items?.length ?? 0)
            ? t("shown", { to: items?.length ?? 0, total })
            : t("found", { count: total })}
        </p>
      )}
      {total > 0 && <ContentLanguageNote language={contentLanguage} />}
      {!items || items.length === 0 ? (
        <p>
          {urgentOnly
            ? t("emptyUrgent")
            : category
              ? t("emptyCategory")
              : t("empty")}
        </p>
      ) : (
        <ul
          role="list"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {items.map((item, index) => {
            const categoryKey = getCategoryKey(item.category);
            const unitKey = getUnitKey(item.unit);
            return (
              <li
                key={item.id}
                id={`need-${index}`}
                className={`group relative flex min-w-0 flex-col gap-3 rounded-2xl border bg-(--surface) p-4 shadow-sm transition duration-300 ease-out hover:shadow-2xl focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-(--focus) motion-safe:hover:-translate-y-1.5 ${
                  item.is_urgent ? "border-(--danger)" : "border-(--border)"
                }`}
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex items-start justify-between gap-2">
                    <h2
                      lang={contentLanguage}
                      className="min-w-0 text-lg font-bold wrap-anywhere"
                    >
                      {item.name}
                    </h2>
                    {item.is_urgent && (
                      <p className="shrink-0 rounded-full bg-(--danger-soft) px-3 py-0.5 text-sm font-semibold text-(--danger)">
                        <span aria-hidden="true">🔥 </span>
                        {t("urgent")}
                      </p>
                    )}
                  </div>
                  <p className="text-(--muted)">
                    {categoryKey
                      ? t(`categories.${categoryKey}`)
                      : item.category}
                  </p>
                </div>
                <div className="mt-auto flex flex-col gap-3">
                  <p className="text-lg font-bold">
                    {t("remaining", {
                      amount: format.number(item.remaining),
                      unit: unitKey ? t(`units.${unitKey}`) : item.unit,
                    })}
                  </p>
                  <a
                    href="#footer-contact-heading"
                    aria-label={t("helpLabel", { name: item.name })}
                    className="flex min-h-11 items-center justify-center self-start rounded-full bg-(--accent) px-5 text-lg font-semibold text-(--accent-contrast) sm:after:absolute sm:after:inset-0"
                  >
                    {t("help")}
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {items && total > items.length && (
        <div className="flex justify-center">
          <Link
            href={`${buildHref(category, shown + NEEDS_PAGE_SIZE, urgentOnly)}#need-${shown}`}
            className="inline-flex min-h-11 items-center rounded-full border border-(--accent) px-5 text-lg font-semibold text-(--accent) transition-colors duration-200 hover:bg-(--hover) motion-reduce:transition-none"
          >
            {t("showMore")}
          </Link>
        </div>
      )}
    </main>
  );
}

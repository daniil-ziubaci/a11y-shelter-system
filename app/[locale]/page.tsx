import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Link } from "@/i18n/navigation";
import { brandUrl } from "@/lib/brandUrl";
import { translateCity } from "@/lib/cityNames";
import { buildAlternates } from "@/lib/seo";
import { createClient } from "@/lib/supabase/server";
import { pickShelterName } from "@/lib/transliterate";

// One shelter: the site opens straight on it. Several: a list to choose from.
// Only published shelters are visible here (RLS on shelters).
async function getShelters(locale: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shelters")
    .select("slug, name, name_ro, name_en, city, content_language, brand_path");
  if (error) {
    throw new Error("Не удалось загрузить приюты из базы.");
  }
  return data
    .map((shelter) => ({
      slug: shelter.slug,
      name: pickShelterName(shelter, locale),
      city: shelter.city
        ? (translateCity(shelter.city, shelter.content_language, locale) ??
          shelter.city)
        : null,
      brandPath: shelter.brand_path,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, locale));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Shelters" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: buildAlternates(locale, ""),
  };
}

export default async function LocaleHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const shelters = await getShelters(locale);

  if (shelters.length === 0) {
    notFound();
  }
  if (shelters.length === 1) {
    redirect(`/${locale}/shelter/${shelters[0].slug}`);
  }

  const t = await getTranslations("Shelters");

  return (
    <>
      <header className="w-full bg-(--background) shadow-md">
        <div className="mx-auto flex w-full max-w-5xl justify-end px-4 py-2">
          <LanguageSwitcher />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-10 pt-6">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-2xl font-bold wrap-break-word sm:text-3xl">
            {t("heading")}
          </h1>
          <p className="text-(--muted)">{t("intro")}</p>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shelters.map((shelter) => (
            <li key={shelter.slug}>
              <Link
                href={`/shelter/${shelter.slug}`}
                className="flex h-full items-center gap-4 rounded-2xl border border-(--border) bg-(--surface) p-4 hover:bg-(--hover)"
              >
                {shelter.brandPath && (
                  <Image
                    src={brandUrl(shelter.brandPath, "logo.png")}
                    alt=""
                    width={56}
                    height={56}
                    unoptimized
                    className="size-14 shrink-0 rounded-lg border-[1.2px] border-(--border-strong)"
                  />
                )}
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="text-lg font-bold wrap-break-word text-(--accent) underline-offset-4">
                    {shelter.name}
                  </span>
                  {shelter.city && (
                    <span className="text-(--muted)">{shelter.city}</span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}

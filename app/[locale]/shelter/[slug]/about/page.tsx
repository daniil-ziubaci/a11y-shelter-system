import { ContentLanguageNote } from "@/components/ContentLanguageNote";
import { toContentLanguage } from "@/lib/contentLanguage";
import { Link } from "@/i18n/navigation";
import { getShelter } from "@/lib/getShelter";
import {
  buildAlternates,
  buildSocialMetadata,
  getShelterPreviewImage,
} from "@/lib/seo";
import { buildShelterJsonLd } from "@/lib/shelterJsonLd";
import { createClient } from "@/lib/supabase/server";
import { truncateText } from "@/lib/truncateText";
import { getTranslations } from "next-intl/server";
import Image from "next/image";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  const shelter = await getShelter(slug, locale);
  const t = await getTranslations({ locale, namespace: "About" });
  const title = shelter.city
    ? t("titleWithCity", { name: shelter.name, city: shelter.city })
    : t("title", { name: shelter.name });
  const description = shelter.about
    ? truncateText(shelter.about, 155)
    : t("descriptionFallback", { name: shelter.name });
  return {
    title,
    description,
    alternates: buildAlternates(locale, `/shelter/${slug}/about`),
    ...buildSocialMetadata({
      locale,
      path: `/shelter/${slug}/about`,
      title,
      description,
      siteName: shelter.name,
      image: getShelterPreviewImage(shelter),
    }),
  };
}

export default async function ShelterAboutPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  const shelter = await getShelter(slug, locale);
  const t = await getTranslations("About");
  const tAdoption = await getTranslations("Adoption");
  const supabase = await createClient();
  const photoUrl =
    shelter.photo_path && shelter.photo_alt
      ? supabase.storage.from("pet-photos").getPublicUrl(shelter.photo_path)
          .data.publicUrl
      : null;
  const aboutParagraphs = shelter.about?.split(/\n{2,}/) ?? [];
  const contentLanguage = toContentLanguage(shelter.content_language);
  const jsonLd = JSON.stringify(
    buildShelterJsonLd(
      shelter,
      `${process.env.SITE_URL!}/${locale}/shelter/${slug}/about`,
    ),
  ).replace(/</g, "\\u003c");

  return (
    <main className="w-full flex flex-col gap-6 p-4 max-w-5xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />

      <section
        aria-labelledby="about-heading"
        className="grid gap-6 lg:grid-cols-2 lg:items-start"
      >
        {photoUrl && (
          <div className="relative shadow-sm aspect-4/3 overflow-hidden rounded-2xl border border-(--border) bg-(--surface)">
            <Image
              src={photoUrl}
              alt={shelter.photo_alt ?? ""}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        )}
        <div className="flex flex-col gap-4 rounded-2xl border border-(--border) bg-(--surface) p-6 shadow-sm">
          <h1 id="about-heading" className="text-3xl font-bold">
            {shelter.name}
          </h1>
          {shelter.about && (
            <>
              <ContentLanguageNote
                language={contentLanguage}
                translated={shelter.translated.about}
              />
              {aboutParagraphs.map((paragraph, index) => (
                <p
                  key={index}
                  lang={shelter.translated.about ? locale : contentLanguage}
                >
                  {paragraph}
                </p>
              ))}
            </>
          )}
        </div>
      </section>

      {shelter.adoption_info && (
        <section
          aria-labelledby="adoption-heading"
          className="flex max-w-3xl flex-col gap-2"
        >
          <h2 id="adoption-heading" className="text-xl font-bold">
            {tAdoption("heading")}
          </h2>
          <ContentLanguageNote
            language={contentLanguage}
            translated={shelter.translated.adoptionInfo}
          />
          <p
            className="whitespace-pre-line"
            lang={shelter.translated.adoptionInfo ? locale : contentLanguage}
          >
            {shelter.adoption_info}
          </p>
        </section>
      )}

      <section
        aria-labelledby="join-call-heading"
        className="flex flex-col gap-6 rounded-2xl bg-(--accent-soft) p-6 shadow-sm"
      >
        <h2 id="join-call-heading" className="text-center text-2xl font-bold">
          {t("joinCallHeading")}
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-bold">{t("joinAdoptTitle")}</h3>
            <p>{t("joinAdoptText")}</p>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-bold">{t("joinHelpTitle")}</h3>
            <p>
              {t.rich("joinHelpText", {
                needs: (chunks) => (
                  <Link
                    href={`/shelter/${slug}/needs`}
                    className="font-semibold text-(--accent) underline"
                  >
                    {chunks}
                  </Link>
                ),
                treatment: (chunks) => (
                  <Link
                    href={`/shelter/${slug}/catalog?mode=treatment`}
                    className="font-semibold text-(--accent) underline"
                  >
                    {chunks}
                  </Link>
                ),
                projects: (chunks) => (
                  <Link
                    href={`/shelter/${slug}/projects`}
                    className="font-semibold text-(--accent) underline"
                  >
                    {chunks}
                  </Link>
                ),
              })}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-bold">{t("joinVolunteerTitle")}</h3>
            <p>{t("joinVolunteerText")}</p>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="join-heading"
        className="flex flex-col gap-4 rounded-2xl border border-(--border) bg-(--surface) p-6 shadow-sm md:items-center md:text-center"
      >
        <h2 id="join-heading" className="text-center text-2xl font-bold">
          {t("joinHeading")}
        </h2>
        <p className="max-w-3xl whitespace-pre-line">{t("joinDefault")}</p>
        <div className="flex flex-wrap gap-3 md:justify-center">
          <Link
            href={`/shelter/${slug}/catalog`}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-(--accent) px-5 py-2 font-semibold text-(--accent-contrast) hover:shadow-md"
          >
            {t("joinFind")}
          </Link>
          <Link
            href={`/shelter/${slug}/needs`}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-(--accent) px-5 py-2 font-semibold text-(--accent-contrast) hover:shadow-md"
          >
            {t("joinHelp")}
          </Link>
          <a
            href="#footer-contact-heading"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-(--accent) px-5 py-2 font-semibold text-(--accent-contrast) hover:shadow-md"
          >
            {t("joinVolunteer")}
          </a>
        </div>
      </section>
    </main>
  );
}

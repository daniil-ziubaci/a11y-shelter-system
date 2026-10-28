import { ShelterContact } from "@/components/ShelterContact";
import { Link } from "@/i18n/navigation";
import { getShelter } from "@/lib/getShelter";
import { buildAlternates } from "@/lib/seo";
import { buildShelterJsonLd } from "@/lib/shelterJsonLd";
import { truncateText } from "@/lib/truncateText";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  const shelter = await getShelter(slug);
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
  };
}

export default async function ShelterAboutPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  const shelter = await getShelter(slug);
  const t = await getTranslations("About");
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
      <h1 className="text-3xl font-bold">{shelter.name}</h1>
      {shelter.about && <p>{shelter.about}</p>}
      <dl className="flex flex-col gap-2">
        {shelter.founded_year && (
          <div className="flex gap-1">
            <dt>{t("founded")}</dt>
            <dd>{shelter.founded_year}</dd>
          </div>
        )}
        {shelter.city && (
          <div className="flex gap-1">
            <dt>{t("city")}</dt>
            <dd>{shelter.city}</dd>
          </div>
        )}
        <div className="flex gap-1">
          <dt>{t("address")}</dt>
          <dd>{shelter.address ?? t("addressByAppointment")}</dd>
        </div>
        {shelter.contact_hours && (
          <div className="flex gap-1">
            <dt>{t("hours")}</dt>
            <dd>{shelter.contact_hours}</dd>
          </div>
        )}
        {shelter.legal_info && (
          <div className="flex gap-1">
            <dt>{t("legal")}</dt>
            <dd>{shelter.legal_info}</dd>
          </div>
        )}
      </dl>
      <section
        aria-labelledby="contact-heading"
        className="flex flex-col gap-2"
      >
        <h2 id="contact-heading" className="text-xl font-bold">
          {t("contactHeading")}
        </h2>

        <ShelterContact
          phone={shelter.contact_phone}
          messenger={shelter.contact_messenger}
          emptyText={t("noContact")}
        />
        {shelter.public_channel_url && (
          <a
            href={shelter.public_channel_url}
            className="underline inline-block py-2"
            rel="noopener noreferrer"
          >
            {t("news")}
          </a>
        )}
        <Link
          href={`/shelter/${slug}/catalog`}
          className="underline inline-block py-2"
        >
          {t("findFriend")}
        </Link>
      </section>
    </main>
  );
}

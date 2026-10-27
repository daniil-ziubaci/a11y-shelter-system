import { Link } from "@/i18n/navigation";
import { getShelter } from "@/lib/getShelter";
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
  return { title, description };
}

export default async function ShelterAboutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const shelter = await getShelter(slug);
  const t = await getTranslations("About");

  return (
    <main className="w-full flex flex-col gap-6 p-4 max-w-5xl mx-auto">
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
        {shelter.contact_phone && (
          <a
            href={`tel:${shelter.contact_phone.replace(/[^\d+]/g, "")}`}
            className="underline inline-block py-2"
          >
            {t("call", { phone: shelter.contact_phone })}
          </a>
        )}
        {shelter.contact_messenger && (
          <a
            href={shelter.contact_messenger}
            className="underline inline-block py-2"
            rel="noopener noreferrer"
          >
            {t("messenger")}
          </a>
        )}
        {!shelter.contact_phone && !shelter.contact_messenger && (
          <p>{t("noContact")}</p>
        )}
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

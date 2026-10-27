import Link from "next/link";
import { getShelter } from "@/lib/getShelter";
import { truncateText } from "@/lib/truncateText";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const shelter = await getShelter(slug);
  const title = shelter.city
    ? `${shelter.name}, ${shelter.city} — о приюте`
    : `${shelter.name} — о приюте`;
  const description = shelter.about
    ? truncateText(shelter.about, 155)
    : `Контакты и информация о приюте «${shelter.name}».`;
  return { title, description };
}

export default async function ShelterAboutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const shelter = await getShelter(slug);

  return (
    <main className="w-full flex flex-col gap-6 p-4 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold">{shelter.name}</h1>
      {shelter.about && <p>{shelter.about}</p>}
      <dl className="flex flex-col gap-2">
        {shelter.founded_year && (
          <div className="flex gap-1">
            <dt>Год основания:</dt>
            <dd>{shelter.founded_year}</dd>
          </div>
        )}
        {shelter.city && (
          <div className="flex gap-1">
            <dt>Город:</dt>
            <dd>{shelter.city}</dd>
          </div>
        )}
        <div className="flex gap-1">
          <dt>Адрес:</dt>
          <dd>{shelter.address ?? "Посещение по договорённости"}</dd>
        </div>
        {shelter.contact_hours && (
          <div className="flex gap-1">
            <dt>Часы связи:</dt>
            <dd>{shelter.contact_hours}</dd>
          </div>
        )}
        {shelter.legal_info && (
          <div className="flex gap-1">
            <dt>Юридическая информация:</dt>
            <dd>{shelter.legal_info}</dd>
          </div>
        )}
      </dl>
      <section
        aria-labelledby="contact-heading"
        className="flex flex-col gap-2"
      >
        <h2 id="contact-heading" className="text-xl font-bold">
          Связаться с приютом
        </h2>
        {shelter.contact_phone && (
          <a
            href={`tel:${shelter.contact_phone.replace(/[^\d+]/g, "")}`}
            className="underline inline-block py-2"
          >
            Позвонить: {shelter.contact_phone}
          </a>
        )}
        {shelter.contact_messenger && (
          <a
            href={shelter.contact_messenger}
            className="underline inline-block py-2"
            rel="noopener noreferrer"
          >
            Написать приюту в мессенджере
          </a>
        )}
        {!shelter.contact_phone && !shelter.contact_messenger && (
          <p>Контакт приюта пока не указан.</p>
        )}
        {shelter.public_channel_url && (
          <a
            href={shelter.public_channel_url}
            className="underline inline-block py-2"
            rel="noopener noreferrer"
          >
            Новости приюта
          </a>
        )}
        <Link
          href={`/shelter/${slug}/catalog`}
          className="underline inline-block py-2"
        >
          Найти друга в каталоге
        </Link>
      </section>
    </main>
  );
}

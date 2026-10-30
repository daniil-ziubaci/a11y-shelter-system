import { toPet } from "@/lib/toPet";
import { formatAge } from "@/lib/formatAge";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { getAnimalKey } from "@/lib/animalKey";
import { getLifeStage } from "@/lib/lifeStage";
import { truncateText } from "@/lib/truncateText";
import { getPet } from "@/lib/getPet";
import { getShelter } from "@/lib/getShelter";
import { getTranslations } from "next-intl/server";
import { getSexKey } from "@/lib/petLabels";
import { buildAlternates } from "@/lib/seo";
import { ShelterContact } from "@/components/ShelterContact";
import { getSizeKey } from "@/lib/petSizes";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; id: string; locale: string }>;
}) {
  const { slug, id, locale } = await params;
  const shelter = await getShelter(slug);
  const data = await getPet(id, shelter.id);
  const pet = toPet(data);
  const t = await getTranslations({ locale, namespace: "Pet" });
  const tAnimal = await getTranslations({ locale, namespace: "Animal" });
  const animal = tAnimal(
    getAnimalKey(pet.species, pet.sex, getLifeStage(pet.ageInMonths)),
  );

  const title = t(
    pet.status === "на лечении" ? "titleInShelter" : "titleWithShelter",
    {
      name: pet.name,
      animal,
      shelter: shelter.name,
    },
  );

  const description = truncateText(pet.description, 155);

  return {
    title,
    description,
    alternates: buildAlternates(locale, `/shelter/${slug}/catalog/${id}`),
    openGraph: {
      title,
      description,
      images: [{ url: pet.photo.url, alt: pet.photo.alt }],
    },
  };
}

export default async function PetPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const shelter = await getShelter(slug);
  const data = await getPet(id, shelter.id);
  const pet = toPet(data);
  const t = await getTranslations("Pet");
  const tAge = await getTranslations("Age");
  const tAdoption = await getTranslations("Adoption");
  const sizeKey = pet.size ? getSizeKey(pet.size) : undefined;

  return (
    <main className="w-full flex flex-col gap-6 p-4 max-w-5xl mx-auto">
      <Link
        href={`/shelter/${slug}/catalog`}
        className="inline-block py-2 underline"
      >
        {t("back")}
      </Link>
      <h1 className="text-3xl font-bold">{pet.name}</h1>
      <div className="relative w-full max-w-md aspect-3/4">
        <Image
          src={pet.photo.url}
          alt={pet.photo.alt}
          fill
          sizes="(min-width: 448px) 448px, 100vw"
          loading="eager"
          className="object-cover"
        />
      </div>

      <dl className="flex flex-wrap gap-x-4">
        <div className="flex gap-1">
          <dt className="sr-only">{t("sex")}</dt>
          <dd>{t(`sexValue.${getSexKey(pet.sex)}`)}</dd>
        </div>
        <div className="flex gap-1">
          <dt className="sr-only">{t("age")}</dt>
          <dd>{formatAge(pet.ageInMonths, pet.isAgeApproximate, tAge)}</dd>
        </div>
        {sizeKey && (
          <div className="flex gap-1">
            <dt>{t("size")}</dt>
            <dd>{t(`sizeValue.${sizeKey}`)}</dd>
          </div>
        )}
      </dl>
      {pet.status === "в процессе" && <p>{t("adoptPending")}</p>}
      <div className="flex flex-wrap gap-4">
        {pet.status === "на лечении" ? (
          <p className="py-2">{t("adoptBlocked")}</p>
        ) : (
          <a
            href="#contact-heading"
            aria-label={t("adoptLabel", { name: pet.name })}
            className="underline inline-block py-2"
          >
            {t("adopt")}
          </a>
        )}
        <a
          href="#contact-heading"
          aria-label={t("helpLabel", { name: pet.name })}
          className="underline inline-block py-2"
        >
          {t("help")}
        </a>
      </div>
      <h2 className="text-xl font-bold">{t("aboutTitle")}</h2>
      <p>{pet.description}</p>
      <h2 className="text-xl font-bold">{t("diet")}</h2>
      <p>{pet.diet}</p>
      <h2 className="text-xl font-bold">{t("health")}</h2>
      <p>{pet.health}</p>
      <section
        aria-labelledby="contact-heading"
        className="flex flex-col gap-2"
      >
        <h2 id="contact-heading" className="text-xl font-bold">
          {t("contactHeading")}
        </h2>
        <p>{t("contactIntro")}</p>
        <ShelterContact
          phone={shelter.contact_phone}
          messenger={shelter.contact_messenger}
          emptyText={t("noContact")}
        />
        {data.needs_treatment_since && (
          <p>
            {t("treatmentNote")}{" "}
            <Link
              href={`/shelter/${slug}/catalog?mode=treatment`}
              className="underline inline-block py-2"
            >
              {t("treatmentLink")}
            </Link>
          </p>
        )}
        <Link
          href={`/shelter/${slug}/about`}
          className="underline inline-block py-2"
        >
          {t("aboutShelter")}
        </Link>
      </section>
      {shelter.adoption_info && (
        <section
          aria-labelledby="adoption-heading"
          className="flex flex-col gap-2"
        >
          <h2 id="adoption-heading" className="text-xl font-bold">
            {tAdoption("heading")}
          </h2>
          <p className="whitespace-pre-line">{shelter.adoption_info}</p>
        </section>
      )}
    </main>
  );
}

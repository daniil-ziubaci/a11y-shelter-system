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
import { PET_STATUS_PENDING, PET_STATUS_TREATMENT } from "@/lib/petStatuses";

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
    pet.status === PET_STATUS_TREATMENT ? "titleInShelter" : "titleWithShelter",
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
  const isTreatmentRelated =
    data.needs_treatment_since !== null || data.status === PET_STATUS_TREATMENT;
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
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <div className="relative w-full aspect-4/3 overflow-hidden rounded-lg border border-(--border) bg-(--surface)">
          <Image
            src={pet.photo.url}
            alt={pet.photo.alt}
            fill
            sizes="(min-width: 1024px) 496px, 100vw"
            loading="eager"
            className="object-contain"
          />
        </div>
        <div className="flex flex-col gap-4">
          <h1 className="text-4xl font-bold sm:text-5xl">{pet.name}</h1>{" "}
          <dl className="flex flex-wrap gap-3">
            <div className="rounded-lg border border-(--border) bg-(--surface) px-4 py-3">
              <dt className="text-sm text-(--muted)">{t("sex")}</dt>
              <dd className="whitespace-nowrap text-lg font-semibold first-letter:uppercase">
                {t(`sexValue.${getSexKey(pet.sex)}`)}
              </dd>
            </div>
            <div className="rounded-lg border border-(--border) bg-(--surface) px-4 py-3">
              <dt className="text-sm text-(--muted)">{t("age")}</dt>
              <dd className="whitespace-nowrap text-lg font-semibold first-letter:uppercase">
                {formatAge(pet.ageInMonths, pet.isAgeApproximate, tAge)}
              </dd>
            </div>
            {sizeKey && (
              <div className="rounded-lg border border-(--border) bg-(--surface) px-4 py-3">
                <dt className="text-sm text-(--muted)">{t("size")}</dt>
                <dd className="whitespace-nowrap text-lg font-semibold first-letter:uppercase">
                  {t(`sizeValue.${sizeKey}`)}
                </dd>
              </div>
            )}
          </dl>
          {pet.status === PET_STATUS_PENDING && <p>{t("adoptPending")}</p>}
          <div className="flex flex-wrap gap-4">
            {pet.status === PET_STATUS_TREATMENT ? (
              <p className="py-2">{t("adoptBlocked")}</p>
            ) : (
              <a
                href="#contact-heading"
                aria-label={t("adoptLabel", { name: pet.name })}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-(--accent) px-5 py-2 font-semibold text-(--accent-contrast) hover:shadow-md"
              >
                {t("adopt")}
              </a>
            )}
            {isTreatmentRelated ? (
              <a
                href="#contact-heading"
                aria-label={t("helpLabel", { name: pet.name })}
                className="inline-flex min-h-11 items-center justify-center rounded-full border-2 border-(--accent) px-5 py-2 font-semibold text-(--accent) hover:bg-(--hover)"
              >
                {t("help")}
              </a>
            ) : (
              <Link
                href={`/shelter/${slug}/needs`}
                aria-label={t("helpLabel", { name: pet.name })}
                className="inline-flex min-h-11 items-center justify-center rounded-full border-2 border-(--accent) px-5 py-2 font-semibold text-(--accent) hover:bg-(--hover)"
              >
                {t("help")}
              </Link>
            )}
          </div>
        </div>
      </div>
      <div className="flex max-w-2xl flex-col gap-2">
        <h2 className="text-xl font-bold">{t("aboutTitle")}</h2>
        <p>{pet.description}</p>
        <h2 className="mt-4 text-xl font-bold">{t("diet")}</h2>
        <p>{pet.diet}</p>
        <h2 className="mt-4 text-xl font-bold">{t("health")}</h2>
        <p>{pet.health}</p>
      </div>
      <section
        aria-labelledby="contact-heading"
        className="flex max-w-2xl flex-col gap-2 rounded-lg border border-(--border) bg-(--surface) p-4"
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
          className="flex max-w-2xl flex-col gap-2"
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

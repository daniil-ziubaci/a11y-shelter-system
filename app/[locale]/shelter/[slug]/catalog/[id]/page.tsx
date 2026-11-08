import { toPet } from "@/lib/toPet";
import { ContentLanguageNote } from "@/components/ContentLanguageNote";
import { toContentLanguage } from "@/lib/contentLanguage";
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
import { buildAlternates, buildSocialMetadata } from "@/lib/seo";
import { getSizeKey } from "@/lib/petSizes";
import {
  PET_STATUS_LOOKING,
  PET_STATUS_PENDING,
  PET_STATUS_TREATMENT,
} from "@/lib/petStatuses";
import { PetBadges } from "@/components/PetBadges";
import { getOtherPets } from "@/lib/getOtherPets";
import { PetCard } from "@/components/PetCard";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; id: string; locale: string }>;
}) {
  const { slug, id, locale } = await params;
  const shelter = await getShelter(slug, locale);
  const data = await getPet(id, shelter.id);
  const pet = toPet(data, locale);
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
    ...buildSocialMetadata({
      locale,
      path: `/shelter/${slug}/catalog/${id}`,
      title,
      description,
      siteName: shelter.name,
      image: { url: `/api/og/pet/${id}`, alt: pet.photo.alt },
    }),
  };
}

export default async function PetPage({
  params,
}: {
  params: Promise<{ slug: string; id: string; locale: string }>;
}) {
  const { slug, id, locale } = await params;
  const shelter = await getShelter(slug, locale);
  const data = await getPet(id, shelter.id);
  const isTreatmentRelated =
    data.needs_treatment_since !== null || data.status === PET_STATUS_TREATMENT;
  const pet = toPet(data, locale);
  const helpButtonBase =
    "inline-flex min-h-14 items-center justify-center rounded-full px-6 py-3 text-lg font-semibold";
  const helpOutlineClass = `${helpButtonBase} border-2 border-(--accent) text-(--accent) hover:bg-(--hover)`;
  const helpTreatmentClass = `${helpButtonBase} border-2 border-(--danger) bg-(--surface) text-(--danger) hover:bg-(--danger-soft)`;

  const t = await getTranslations("Pet");
  const tAge = await getTranslations("Age");
  const tAdoption = await getTranslations("Adoption");
  const contentLanguage = toContentLanguage(shelter.content_language);
  const sizeKey = pet.size ? getSizeKey(pet.size) : undefined;
  const treatmentPets = isTreatmentRelated
    ? await getOtherPets(shelter.id, id, locale, true)
    : [];
  const showTreatmentBlock = treatmentPets.length > 0;
  const otherPets = showTreatmentBlock
    ? treatmentPets
    : await getOtherPets(shelter.id, id, locale);

  return (
    <main className="w-full flex flex-col gap-6 p-4 max-w-5xl mx-auto">
      <nav aria-label={t("breadcrumbLabel")}>
        <ol className="flex flex-wrap items-center gap-x-2 text-base">
          <li className="flex items-center gap-x-2">
            <Link
              href={`/shelter/${slug}`}
              className="inline-flex items-center py-1 text-(--muted) transition-colors hover:text-(--foreground) motion-reduce:transition-none"
            >
              {t("breadcrumbHome")}
            </Link>
            <span aria-hidden="true">/</span>
          </li>
          <li className="flex items-center gap-x-2">
            <Link
              href={
                isTreatmentRelated
                  ? `/shelter/${slug}/catalog?mode=treatment`
                  : `/shelter/${slug}/catalog`
              }
              className="inline-flex items-center py-1 text-(--muted) transition-colors hover:text-(--foreground) motion-reduce:transition-none"
            >
              {isTreatmentRelated
                ? t("breadcrumbTreatment")
                : t("breadcrumbCatalog")}
            </Link>
            <span aria-hidden="true">/</span>
          </li>
          <li aria-current="page" className="font-semibold text-(--accent)">
            {pet.name}
          </li>
        </ol>
      </nav>
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <div className="relative w-full aspect-4/3 overflow-hidden rounded-lg border border-(--border) bg-(--surface)">
          <Image
            src={pet.photo.url}
            alt={pet.photo.alt}
            fill
            unoptimized
            loading="eager"
            className="object-contain"
          />
        </div>
        <div className="flex flex-col gap-3">
          {(pet.status !== PET_STATUS_LOOKING || pet.needsTreatmentSince) && (
            <div className="flex flex-wrap items-center gap-2">
              <PetBadges
                status={pet.status}
                needsTreatmentSince={pet.needsTreatmentSince}
              />
            </div>
          )}
          <h1 className="text-4xl font-bold sm:text-5xl">{pet.name}</h1>
          <dl className="flex flex-wrap gap-2">
            <div className="rounded-lg border border-(--border) bg-(--surface) px-4 py-3">
              <dt className="text-sm text-(--muted)">{t("sex")}</dt>
              <dd className="whitespace-nowrap font-semibold first-letter:uppercase">
                {t(`sexValue.${getSexKey(pet.sex)}`)}
              </dd>
            </div>
            <div className="rounded-lg border border-(--border) bg-(--surface) px-4 py-3">
              <dt className="text-sm text-(--muted)">{t("age")}</dt>
              <dd className="whitespace-nowrap font-semibold first-letter:uppercase">
                {formatAge(pet.ageInMonths, pet.isAgeApproximate, tAge)}
              </dd>
            </div>
            {sizeKey && (
              <div className="rounded-lg border border-(--border) bg-(--surface) px-4 py-3">
                <dt className="text-sm text-(--muted)">{t("size")}</dt>
                <dd className="whitespace-nowrap font-semibold first-letter:uppercase">
                  {t(`sizeValue.${sizeKey}`)}
                </dd>
              </div>
            )}
          </dl>
          <div className="flex flex-col gap-2 rounded-lg border border-(--border) bg-(--surface) p-4">
            <h2 className="text-xl font-bold">{t("aboutTitle")}</h2>
            <ContentLanguageNote
              language={contentLanguage}
              translated={pet.translated.description}
            />
            <p lang={pet.translated.description ? locale : contentLanguage}>
              {pet.description}
            </p>
          </div>
          <div className="flex flex-col gap-2 rounded-lg border border-(--border) bg-(--surface) p-4">
            <h2 className="text-xl font-bold">{t("health")}</h2>
            {pet.translated.health !== pet.translated.description && (
              <ContentLanguageNote
                language={contentLanguage}
                translated={pet.translated.health}
              />
            )}
            <p lang={pet.translated.health ? locale : contentLanguage}>
              {pet.health}
            </p>
          </div>
          {pet.status === PET_STATUS_PENDING && (
            <p className="rounded-lg border border-(--border) bg-(--accent-soft) px-4 py-3">
              {t("adoptPending")}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-3">
            {pet.status !== PET_STATUS_TREATMENT && (
              <a
                href="#footer-contact-heading"
                aria-label={t("adoptLabel", { name: pet.name })}
                className="inline-flex min-h-14 items-center justify-center rounded-full bg-(--accent) px-6 py-3 text-lg font-semibold text-(--accent-contrast) hover:shadow-md"
              >
                {t("adopt")}
              </a>
            )}
            {isTreatmentRelated ? (
              <a
                href="#footer-contact-heading"
                aria-label={t("helpTreatmentLabel", { name: pet.name })}
                className={helpTreatmentClass}
              >
                {t("helpTreatment")}
              </a>
            ) : (
              <Link
                href={`/shelter/${slug}/needs`}
                aria-label={t("helpLabel", { name: pet.name })}
                className={helpOutlineClass}
              >
                {t("help")}
              </Link>
            )}
          </div>
        </div>
      </div>

      {shelter.adoption_info && (
        <section
          aria-labelledby="adoption-heading"
          className="flex max-w-2xl flex-col gap-2"
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
      {otherPets.length > 0 && (
        <section
          aria-labelledby="other-pets-heading"
          className="mt-2 -mb-4 flex flex-col gap-4 bg-(--accent-soft) pt-8 pb-10 shadow-[0_0_0_100vmax_var(--accent-soft)] [clip-path:inset(0_-100vmax)]"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-4">
            <h2 id="other-pets-heading" className="text-2xl font-bold">
              {showTreatmentBlock
                ? t("otherTreatmentHeading")
                : t("otherHeading")}
            </h2>
            <Link
              href={
                showTreatmentBlock
                  ? `/shelter/${slug}/catalog?mode=treatment`
                  : `/shelter/${slug}/catalog`
              }
              className="group inline-flex min-h-11 items-center gap-1.5 font-medium text-(--accent) transition-colors hover:text-(--foreground) motion-reduce:transition-none"
            >
              {showTreatmentBlock ? t("toTreatment") : t("toCatalog")}
              <span
                aria-hidden="true"
                className="inline-block transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none"
              >
                →
              </span>
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {otherPets.map((other) => (
              <PetCard key={other.id} pet={other} slug={slug} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

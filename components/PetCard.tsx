import type { Pet } from "@/types/pet";
import { formatAge } from "@/lib/formatAge";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { getSexKey, getStatusKey } from "@/lib/petLabels";
import { getSizeKey } from "@/lib/petSizes";

export function PetCard({
  pet,
  slug,
  eager = false,
}: {
  pet: Pet;
  slug: string;
  eager?: boolean;
}) {
  const t = useTranslations("Pet");
  const tAge = useTranslations("Age");
  const statusKey = getStatusKey(pet.status);
  const sizeKey = pet.size ? getSizeKey(pet.size) : undefined;
  const showStatusBadge = pet.status !== "ищет дом";
  const isInTreatment = pet.status === "на лечении";

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-lg border border-(--border) bg-(--surface) transition duration-300 ease-out hover:shadow-2xl motion-safe:hover:-translate-y-1.5 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-(--focus)">
      <div className="relative aspect-4/3">
        {(showStatusBadge || pet.needsTreatmentSince) && (
          <div className="absolute top-2.5 left-2.5 z-10 flex flex-col items-start gap-1.5">
            {pet.needsTreatmentSince && (
              <p className="inline-flex items-center gap-1.5 rounded-full bg-(--danger-soft) px-2.5 py-0.5 text-sm font-medium text-(--danger) shadow-sm ring-1 ring-(--border)">
                <span
                  aria-hidden="true"
                  className="size-1.5 rounded-full bg-(--danger)"
                />
                {t("needsTreatmentBadge")}
              </p>
            )}
            {showStatusBadge && (
              <p
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-sm font-medium shadow-sm ring-1 ${
                  isInTreatment
                    ? "bg-(--hover) text-(--muted) ring-(--border-strong)"
                    : "bg-(--pending-soft) text-(--pending) ring-(--border)"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`size-1.5 rounded-full ${
                    isInTreatment ? "bg-(--muted)" : "bg-(--pending)"
                  }`}
                />
                {statusKey ? t(`status.${statusKey}`) : pet.status}
              </p>
            )}
          </div>
        )}
        <Image
          src={pet.photo.url}
          alt={pet.photo.alt}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          loading={eager ? "eager" : "lazy"}
          className="object-cover bg-(--hover)"
        />
      </div>
      <div className="flex flex-1 flex-col justify-between gap-1 px-4 py-3">
        <h2 className="text-xl font-bold transition-colors duration-200 group-hover:text-(--accent) group-focus-within:text-(--accent) motion-reduce:transition-none">
          {pet.name}
        </h2>
        <dl className="flex flex-wrap gap-x-3">
          <div>
            <dt className="sr-only">{t("sex")}</dt>
            <dd className="first-letter:uppercase">
              {t(`sexValue.${getSexKey(pet.sex)}`)}
            </dd>
          </div>
          <div>
            <dt className="sr-only">{t("age")}</dt>
            <dd>{formatAge(pet.ageInMonths, pet.isAgeApproximate, tAge)}</dd>
          </div>
        </dl>
        <div className="flex items-end gap-2">
          {sizeKey && (
            <dl className="flex gap-1 text-(--muted)">
              <dt>{t("size")}</dt>
              <dd>{t(`sizeValue.${sizeKey}`)}</dd>
            </dl>
          )}
          <Link
            href={`/shelter/${slug}/catalog/${pet.id}`}
            aria-label={t("moreLabel", { name: pet.name })}
            className="ml-auto font-medium transition-colors duration-200 group-hover:text-(--accent) group-focus-within:text-(--accent) motion-reduce:transition-none after:absolute after:inset-0"
          >
            {t("more")}
            <span
              aria-hidden="true"
              className="ml-1 inline-block transition-transform duration-200 group-hover:translate-x-1 group-focus-within:translate-x-1 motion-reduce:transition-none"
            >
              →
            </span>
          </Link>
        </div>
      </div>
    </article>
  );
}

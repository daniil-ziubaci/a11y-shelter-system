import type { Pet } from "@/types/pet";
import { formatAge } from "@/lib/formatAge";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { getSexKey, getStatusKey } from "@/lib/petLabels";

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

  return (
    <article className="p-4 border rounded-lg flex flex-col gap-4 relative focus-within:outline-2 focus-within:outline-offset-2 hover:bg-gray-900">
      <div className="relative aspect-3/4">
        <p className="absolute top-2 left-2 bg-white text-black px-2 py-1 rounded text-sm font-medium">
          {statusKey ? t(`status.${statusKey}`) : pet.status}
        </p>
        <Image
          src={pet.photo.url}
          alt={pet.photo.alt}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          loading={eager ? "eager" : "lazy"}
          className="object-cover bg-gray-100"
        />
      </div>
      <h2 className="text-xl font-bold">
        <Link
          href={`/shelter/${slug}/catalog/${pet.id}`}
          className="after:absolute after:inset-0"
        >
          {pet.name}
        </Link>
      </h2>
      <dl className="flex flex-wrap gap-x-4">
        <div className="flex gap-1">
          <dt className="sr-only">{t("sex")}</dt>
          <dd>{t(`sexValue.${getSexKey(pet.sex)}`)}</dd>
        </div>
        <div className="flex gap-1">
          <dt className="sr-only">{t("age")}</dt>
          <dd>{formatAge(pet.ageInMonths, pet.isAgeApproximate, tAge)}</dd>
        </div>
        <div className="flex gap-1">
          <dt className="sr-only">{t("weight")}</dt>
          <dd>{t("weightValue", { weight: pet.weight })}</dd>
        </div>
      </dl>
      <p className="line-clamp-2">{pet.description}</p>
    </article>
  );
}

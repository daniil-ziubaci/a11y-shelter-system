import { getShelter } from "@/lib/getShelter";
import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import { getFormatter, getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  const shelter = await getShelter(slug);
  const t = await getTranslations({ locale, namespace: "Treatment" });
  return {
    title: t("title", { shelter: shelter.name }),
    description: t("description", { shelter: shelter.name }),
  };
}

export default async function ShelterTreatmentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const shelter = await getShelter(slug);
  const t = await getTranslations("Treatment");
  const format = await getFormatter();
  const supabase = await createClient();
  const { data: pets, error } = await supabase
    .from("pets")
    .select("id, name, needs_treatment_since")
    .eq("shelter_id", shelter.id)
    .in("status", ["ищет дом", "в процессе"])
    .not("needs_treatment_since", "is", null)
    .order("needs_treatment_since");

  if (error) {
    return (
      <main className="w-full flex flex-col gap-6 p-4 max-w-5xl mx-auto">
        <p role="alert">{t("loadError")}</p>
      </main>
    );
  }
  return (
    <main className="w-full flex flex-col gap-6 p-4 max-w-5xl mx-auto">
      <h1>{t("heading")}</h1>
      {!pets || pets.length === 0 ? (
        <p>{t("empty")}</p>
      ) : (
        <ul>
          {pets.map((pet) => (
            <li key={pet.id}>
              <Link href={`/shelter/${slug}/catalog/${pet.id}`}>
                {pet.name}
              </Link>
              {pet.needs_treatment_since && (
                <p>
                  {t("since", {
                    date: format.dateTime(new Date(pet.needs_treatment_since), {
                      day: "numeric",
                      month: "long",
                    }),
                  })}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

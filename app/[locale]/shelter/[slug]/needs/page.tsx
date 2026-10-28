import { getShelter } from "@/lib/getShelter";
import { getCategoryKey } from "@/lib/needCategories";
import { buildAlternates } from "@/lib/seo";
import { createClient } from "@/lib/supabase/server";
import { getFormatter, getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  const shelter = await getShelter(slug);
  const t = await getTranslations({ locale, namespace: "Needs" });
  return {
    title: t("title", { shelter: shelter.name }),
    description: t("description", { shelter: shelter.name }),
    alternates: buildAlternates(locale, `/shelter/${slug}/needs`),
  };
}

export default async function ShelterNeedsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const shelter = await getShelter(slug);
  const t = await getTranslations("Needs");
  const format = await getFormatter();
  const supabase = await createClient();
  const { data: items, error } = await supabase
    .from("purchase_items")
    .select("id, name, category, unit, remaining")
    .eq("shelter_id", shelter.id)
    .gt("remaining", 0)
    .order("created_at");

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
      {!items || items.length === 0 ? (
        <p>{t("empty")}</p>
      ) : (
        <ul>
          {items.map((item) => {
            const categoryKey = getCategoryKey(item.category);
            return (
              <li key={item.id}>
                <h2>{item.name}</h2>
                <p>
                  {categoryKey ? t(`categories.${categoryKey}`) : item.category}
                </p>
                <p>
                  {t("remaining", {
                    amount: format.number(item.remaining),
                    unit: item.unit,
                  })}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

import { ShelterContact } from "@/components/ShelterContact";
import { Link } from "@/i18n/navigation";
import { getShelter } from "@/lib/getShelter";
import { getCategoryKey } from "@/lib/needCategories";
import { getUnitKey } from "@/lib/needUnits";
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
  const tAbout = await getTranslations("About");
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

  const helpBlock = (
    <section aria-labelledby="help-heading" className="flex flex-col gap-2">
      <h2 id="help-heading" className="text-xl font-bold">
        {t("howToHelpHeading")}
      </h2>
      <p>{t("howToHelpIntro")}</p>
      <ShelterContact
        phone={shelter.contact_phone}
        messenger={shelter.contact_messenger}
        emptyText={t("noContactNeeds")}
      />
      {shelter.public_channel_url && (
        <a
          href={shelter.public_channel_url}
          className="underline inline-block py-2"
          rel="noopener noreferrer"
        >
          {tAbout("news")}
        </a>
      )}
      <Link
        href={`/shelter/${slug}/about`}
        className="underline inline-block py-2"
      >
        {t("aboutLink")}
      </Link>
    </section>
  );

  return (
    <main className="w-full flex flex-col gap-6 p-4 max-w-5xl mx-auto">
      <h1>{t("heading")}</h1>
      {!items || items.length === 0 ? (
        <p>{t("empty")}</p>
      ) : (
        <ul>
          {items.map((item) => {
            const categoryKey = getCategoryKey(item.category);
            const unitKey = getUnitKey(item.unit);
            return (
              <li key={item.id}>
                <h2>{item.name}</h2>
                <p>
                  {categoryKey ? t(`categories.${categoryKey}`) : item.category}
                </p>
                <p>
                  {t("remaining", {
                    amount: format.number(item.remaining),
                    unit: unitKey ? t(`units.${unitKey}`) : item.unit,
                  })}
                </p>
                <a
                  href="#help-heading"
                  aria-label={t("helpLabel", { name: item.name })}
                  className="underline inline-block py-2"
                >
                  {t("help")}
                </a>
              </li>
            );
          })}
        </ul>
      )}
      {helpBlock}
    </main>
  );
}

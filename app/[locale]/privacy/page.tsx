import { buildAlternates } from "@/lib/seo";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Privacy" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: buildAlternates(locale, "/privacy"),
  };
}

const sectionKeys = [
  "data",
  "cookies",
  "recipients",
  "operator",
  "retention",
  "rights",
] as const;

export default async function PrivacyPage() {
  const t = await getTranslations("Privacy");

  return (
    <main className="w-full flex flex-col gap-6 p-4 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold">{t("heading")}</h1>
      <p>{t("intro")}</p>
      <p className="rounded-2xl bg-(--accent-soft) p-4">{t("draftNotice")}</p>
      {sectionKeys.map((key) => (
        <section
          key={key}
          aria-labelledby={`${key}-heading`}
          className="flex flex-col gap-2"
        >
          <h2 id={`${key}-heading`} className="text-xl font-bold">
            {t(`${key}.heading`)}
          </h2>
          <p className="whitespace-pre-line">{t(`${key}.text`)}</p>
        </section>
      ))}
    </main>
  );
}

import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

export default async function NotFound() {
  const t = await getTranslations("NotFound");

  return (
    <main className="w-full flex flex-col items-center gap-4 p-8 max-w-3xl mx-auto text-center">
      <title>{t("title")}</title>
      <h1 className="text-3xl font-bold">{t("heading")}</h1>
      <p>{t("text")}</p>
      <Link
        href="/"
        className="inline-flex min-h-11 items-center justify-center rounded-full bg-(--accent) px-5 py-2 font-semibold text-(--accent-contrast) hover:shadow-md"
      >
        {t("home")}
      </Link>
    </main>
  );
}

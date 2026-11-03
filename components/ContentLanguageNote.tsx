import type { ContentLanguage } from "@/lib/contentLanguage";
import { getLocale, getTranslations } from "next-intl/server";

export async function ContentLanguageNote({
  language,
}: {
  language: ContentLanguage;
}) {
  const locale = await getLocale();
  if (language === locale) return null;
  const t = await getTranslations("ContentLanguage");
  return <p className="text-sm text-(--muted)">{t("note", { language })}</p>;
}

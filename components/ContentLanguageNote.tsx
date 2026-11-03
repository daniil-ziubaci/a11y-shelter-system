import type { ContentLanguage } from "@/lib/contentLanguage";
import { getLocale, getTranslations } from "next-intl/server";

export async function ContentLanguageNote({
  language,
  translated = false,
}: {
  language: ContentLanguage;
  translated?: boolean;
}) {
  const locale = await getLocale();
  if (language === locale) return null;
  const t = await getTranslations("ContentLanguage");
  return (
    <p className="text-sm text-(--muted)">
      {translated ? t("translated") : t("note", { language })}
    </p>
  );
}

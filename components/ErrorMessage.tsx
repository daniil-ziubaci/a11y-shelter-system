"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export function ErrorMessage({ retry }: { retry: () => void }) {
  const t = useTranslations("Error");

  return (
    <main className="w-full flex flex-col items-center gap-4 p-8 max-w-3xl mx-auto text-center">
      <title>{t("title")}</title>
      <h1 className="text-3xl font-bold">{t("heading")}</h1>
      <p role="alert">{t("text")}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={retry}
          className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full bg-(--accent) px-5 py-2 font-semibold text-(--accent-contrast) hover:shadow-md"
        >
          {t("retry")}
        </button>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-(--border) bg-(--surface) px-5 py-2 font-semibold text-(--accent) hover:shadow-md"
        >
          {t("home")}
        </Link>
      </div>
    </main>
  );
}

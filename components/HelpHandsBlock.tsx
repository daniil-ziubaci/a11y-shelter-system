import { getTranslations } from "next-intl/server";

export async function HelpHandsBlock({ phone }: { phone: string | null }) {
  const t = await getTranslations("Needs");

  if (!phone) {
    return null;
  }

  return (
    <section
      id="help-hands"
      aria-labelledby="hands-heading"
      className="flex flex-col gap-4 rounded-2xl border-[1.2px] border-(--border-strong) bg-(--surface) p-6 shadow-md"
    >
      <h2 id="hands-heading" className="text-xl font-bold">
        {t("handsHeading")}
      </h2>
      <p>{t("handsText")}</p>
      <a
        href={`tel:${phone.replace(/[^\d+]/g, "")}`}
        className="inline-flex min-h-14 max-w-full items-center justify-start self-start rounded-full bg-(--accent) px-6 py-3 text-left text-lg font-semibold text-(--accent-contrast) hover:shadow-md"
      >
        {t("handsCall", { phone })}
      </a>
    </section>
  );
}

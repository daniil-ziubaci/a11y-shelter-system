import { getTranslations } from "next-intl/server";

export async function ShelterContact({
  phone,
  email,
  messenger,
  emptyText,
}: {
  phone: string | null;
  email: string | null;
  messenger: string | null;
  emptyText: string;
}) {
  const t = await getTranslations("About");

  return (
    <>
      <div className="flex flex-wrap gap-3">
        {phone && (
          <a
            href={`tel:${phone.replace(/[^\d+]/g, "")}`}
            className="inline-flex min-h-14 max-w-full items-center justify-start rounded-full bg-(--accent) px-6 py-3 text-left text-lg font-semibold text-(--accent-contrast) hover:shadow-md"
          >
            {t("call", { phone })}
          </a>
        )}
        {messenger && (
          <a
            href={messenger}
            className="inline-flex min-h-14 max-w-full items-center justify-start rounded-full border-2 border-(--accent) px-6 py-3 text-left text-lg font-semibold text-(--accent) hover:bg-(--hover)"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("messenger")}
            <span className="sr-only"> {t("newTab")}</span>
          </a>
        )}
        {!phone && !email && !messenger && <p>{emptyText}</p>}
      </div>
      {phone && <p className="mt-3">{t("phoneNote")}</p>}
      {email && <p className="mt-3">{t("emailLine", { email })}</p>}
    </>
  );
}

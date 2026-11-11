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
        {email && (
          <a
            href={`mailto:${email}`}
            className="inline-flex min-h-14 max-w-full items-center justify-start break-all rounded-full border-2 border-(--accent) px-6 py-3 text-left text-lg font-semibold text-(--accent) hover:bg-(--hover)"
          >
            {t("email", { email })}
          </a>
        )}
        {messenger && (
          <a
            href={messenger}
            className="inline-flex min-h-14 max-w-full items-center justify-start rounded-full border-2 border-(--accent) px-6 py-3 text-left text-lg font-semibold text-(--accent) hover:bg-(--hover)"
            rel="noopener noreferrer"
          >
            {t("messenger")}
          </a>
        )}
        {!phone && !email && !messenger && <p>{emptyText}</p>}
      </div>
      {phone && <p className="mt-3">{t("phoneNote")}</p>}
    </>
  );
}

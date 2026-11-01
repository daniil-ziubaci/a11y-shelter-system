import { getTranslations } from "next-intl/server";

export async function ShelterContact({
  phone,
  messenger,
  emptyText,
}: {
  phone: string | null;
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
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-(--accent) px-5 py-2 font-semibold text-(--accent-contrast) hover:shadow-md"
          >
            {t("call", { phone })}
          </a>
        )}
        {messenger && (
          <a
            href={messenger}
            className="inline-flex min-h-11 items-center justify-center rounded-full border-2 border-(--accent) px-5 py-2 font-semibold text-(--accent) hover:bg-(--hover)"
            rel="noopener noreferrer"
          >
            {t("messenger")}
          </a>
        )}
        {!phone && !messenger && <p>{emptyText}</p>}
      </div>
    </>
  );
}

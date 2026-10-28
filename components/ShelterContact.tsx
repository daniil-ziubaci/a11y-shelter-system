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
      {phone && (
        <a
          href={`tel:${phone.replace(/[^\d+]/g, "")}`}
          className="underline inline-block py-2"
        >
          {t("call", { phone })}
        </a>
      )}
      {messenger && (
        <a
          href={messenger}
          className="underline inline-block py-2"
          rel="noopener noreferrer"
        >
          {t("messenger")}
        </a>
      )}
      {!phone && !messenger && <p>{emptyText}</p>}
    </>
  );
}

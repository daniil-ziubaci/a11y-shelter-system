import { ShelterContact } from "@/components/ShelterContact";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

export async function ShelterFooter({
  slug,
  name,
  phone,
  messenger,
  hours,
  address,
}: {
  slug: string;
  name: string;
  phone: string | null;
  messenger: string | null;
  hours: string | null;
  address: string | null;
}) {
  const t = await getTranslations("Footer");
  const tNav = await getTranslations("Nav");

  return (
    <footer className="mt-auto w-full bg-(--surface)">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-8">
        <section
          aria-labelledby="footer-contact-heading"
          className="flex max-w-2xl flex-col gap-3"
        >
          <h2 id="footer-contact-heading" className="text-xl font-bold">
            {t("contactHeading")}
          </h2>
          <p>{t("contactIntro")}</p>
          <ShelterContact
            phone={phone}
            messenger={messenger}
            emptyText={t("noContact")}
          />
          {hours && <p>{t("hours", { hours })}</p>}
          {address && <p>{t("address", { address })}</p>}
        </section>
        <div className="flex flex-wrap items-center gap-x-6">
          <p className="font-semibold">{name}</p>
          <Link
            href={`/shelter/${slug}/about`}
            className="inline-block py-2 font-semibold text-(--accent) underline"
          >
            {tNav("about")}
          </Link>
        </div>
      </div>
    </footer>
  );
}

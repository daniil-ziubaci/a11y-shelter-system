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
  city,
  foundedYear,
  legalInfo,
  channelUrl,
}: {
  slug: string;
  name: string;
  phone: string | null;
  messenger: string | null;
  hours: string | null;
  address: string | null;
  city: string | null;
  foundedYear: number | null;
  legalInfo: string | null;
  channelUrl: string | null;
}) {
  const t = await getTranslations("Footer");
  const tNav = await getTranslations("Nav");
  const catalogPath = `/shelter/${slug}/catalog`;
  const links = [
    { href: catalogPath, label: tNav("catalog") },
    { href: `/shelter/${slug}/needs`, label: tNav("needs") },
    { href: `${catalogPath}?mode=treatment`, label: tNav("treatment") },
    { href: `/shelter/${slug}/projects`, label: tNav("projects") },
    { href: `/shelter/${slug}/about`, label: tNav("about") },
  ];

  return (
    <footer className="mt-auto w-full bg-(--surface)">
      <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-8 md:grid-cols-[repeat(3,auto)] md:justify-center md:gap-x-16">
        <section
          aria-labelledby="footer-contact-heading"
          className="flex flex-col gap-3"
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
        </section>
        <section
          aria-labelledby="footer-about-heading"
          className="flex flex-col gap-3"
        >
          <h2 id="footer-about-heading" className="text-xl font-bold">
            {name}
          </h2>
          {city && <p>{t("city", { city })}</p>}
          {address && <p>{t("address", { address })}</p>}
          {foundedYear !== null && <p>{t("founded", { year: foundedYear })}</p>}
          {legalInfo && <p>{t("legal", { legal: legalInfo })}</p>}
        </section>
        <nav
          aria-labelledby="footer-links-heading"
          className="flex flex-col gap-3"
        >
          <p id="footer-links-heading" className="text-xl font-bold">
            {t("linksLabel")}
          </p>
          <ul className="flex flex-col">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-block py-2 font-semibold text-(--accent) hover:underline"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            {channelUrl && (
              <li>
                <a
                  href={channelUrl}
                  className="inline-block py-2 font-semibold text-(--accent) hover:underline"
                  rel="noopener noreferrer"
                >
                  {t("news")}
                </a>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </footer>
  );
}

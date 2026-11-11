import { ShelterContact } from "@/components/ShelterContact";
import { SocialLinks } from "@/components/SocialLinks";
import { Link } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";

export async function ShelterFooter({
  slug,
  name,
  phone,
  email,
  messenger,
  hours,
  address,
  city,
  foundedYear,
  legalInfo,
  hoursLanguage,
  legalInfoLanguage,
  contentLanguage,
  instagram,
  facebook,
  whatsapp,
  viber,
  telegram,
}: {
  slug: string;
  name: string;
  phone: string | null;
  email: string | null;
  messenger: string | null;
  hours: string | null;
  address: string | null;
  city: string | null;
  foundedYear: number | null;
  legalInfo: string | null;
  hoursLanguage: string;
  legalInfoLanguage: string;
  contentLanguage: string;
  instagram: string | null;
  facebook: string | null;
  whatsapp: string | null;
  viber: string | null;
  telegram: string | null;
}) {
  const t = await getTranslations("Footer");
  const tNav = await getTranslations("Nav");
  const locale = await getLocale();
  const showTranslationNote = locale !== contentLanguage;
  const catalogPath = `/shelter/${slug}/catalog`;
  const links = [
    { href: `/shelter/${slug}`, label: tNav("home") },
    { href: catalogPath, label: tNav("catalog") },
    { href: `/shelter/${slug}/needs`, label: tNav("needs") },
    { href: `${catalogPath}?mode=treatment`, label: tNav("treatment") },
    { href: `/shelter/${slug}/projects`, label: tNav("projects") },
    { href: `/shelter/${slug}/about`, label: tNav("about") },
  ];

  return (
    <footer className="mt-auto w-full bg-(--surface)">
      <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 pb-8 pt-8 md:grid-cols-3 md:gap-x-12">
        <section
          aria-labelledby="footer-contact-heading"
          className="flex flex-col gap-5"
        >
          <div className="flex flex-col gap-2">
            <h2 id="footer-contact-heading" className="text-xl font-bold">
              {t("contactHeading")}
            </h2>
            <p>{t("contactIntro")}</p>
          </div>
          <ShelterContact
            phone={phone}
            email={email}
            messenger={messenger}
            emptyText={t("noContact")}
          />
          <SocialLinks
            instagram={instagram}
            facebook={facebook}
            whatsapp={whatsapp}
            viber={viber}
            telegram={telegram}
          />
        </section>
        <section
          aria-labelledby="footer-about-heading"
          className="flex flex-col gap-4 border-t border-(--border) pt-8 md:border-t-0 md:pt-0"
        >
          <h2 id="footer-about-heading" className="text-xl font-bold">
            {name}
          </h2>
          <dl className="flex flex-col gap-5 text-pretty [&_dd]:mt-1">
            {city && (
              <div>
                <dt className="text-sm text-(--muted)">{t("cityLabel")}</dt>
                <dd>{city}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm text-(--muted)">{t("addressLabel")}</dt>
              <dd>{address || t("addressByAppointment")}</dd>
            </div>
            {hours && (
              <div>
                <dt className="text-sm text-(--muted)">{t("hoursLabel")}</dt>
                <dd lang={hoursLanguage}>{hours}</dd>
              </div>
            )}
            {foundedYear !== null && (
              <div>
                <dt className="text-sm text-(--muted)">{t("foundedLabel")}</dt>
                <dd>{foundedYear}</dd>
              </div>
            )}
            {legalInfo && (
              <div>
                <dt className="text-sm text-(--muted)">{t("legalLabel")}</dt>
                <dd lang={legalInfoLanguage}>{legalInfo}</dd>
              </div>
            )}
          </dl>
        </section>
        <nav
          aria-labelledby="footer-links-heading"
          className="flex flex-col gap-3 border-t border-(--border) pt-8 md:border-t-0 md:pt-0"
        >
          <p id="footer-links-heading" className="text-xl font-bold">
            {t("linksLabel")}
          </p>
          <ul className="grid grid-cols-2 gap-x-4 md:flex md:flex-col">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-block py-3 font-semibold text-(--accent) hover:underline"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/privacy"
                className="inline-block py-3 font-semibold text-(--accent) hover:underline"
              >
                {t("privacyLink")}
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {showTranslationNote && (
        <p className="mx-auto w-full max-w-5xl px-4 pb-8 text-sm text-(--muted)">
          {t("translationNote")}
        </p>
      )}
    </footer>
  );
}

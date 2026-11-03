import { ShelterNav } from "@/app/[locale]/shelter/[slug]/shelter-nav";
import { ScrollTopLink } from "@/components/ScrollTopLink";
import { toContentLanguage } from "@/lib/contentLanguage";
import { getShelter } from "@/lib/getShelter";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ShelterFooter } from "@/components/ShelterFooter";
import { getTranslations } from "next-intl/server";

export default async function ShelterLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const shelter = await getShelter(slug);
  const t = await getTranslations("Nav");

  return (
    <>
      <a
        href="#content"
        className="fixed left-4 top-4 z-50 -translate-y-24 rounded-md bg-(--surface) px-4 py-2 font-semibold text-(--accent) underline shadow-md focus:translate-y-0"
      >
        {t("skipToContent")}
      </a>
      <header className="sticky top-0 z-30 w-full bg-(--background) shadow-md">
        <div className="relative mx-auto flex w-full max-w-5xl items-center justify-between gap-x-4 px-4 py-1">
          <ScrollTopLink
            href={`/shelter/${slug}`}
            className="py-2 text-lg font-bold"
          >
            {shelter.name}
          </ScrollTopLink>
          <div className="flex items-center gap-3 lg:order-3">
            <LanguageSwitcher />
            <div className="lg:hidden">
              <ShelterNav slug={slug} />
            </div>
          </div>
          <div className="hidden lg:order-2 lg:block">
            <ShelterNav slug={slug} />
          </div>
        </div>
      </header>
      <div id="content" tabIndex={-1} className="focus:outline-none">
        {children}
      </div>

      <ShelterFooter
        slug={slug}
        name={shelter.name}
        phone={shelter.contact_phone}
        messenger={shelter.contact_messenger}
        hours={shelter.contact_hours}
        address={shelter.address}
        city={shelter.city}
        foundedYear={shelter.founded_year}
        legalInfo={shelter.legal_info}
        contentLanguage={toContentLanguage(shelter.content_language)}
        instagram={shelter.instagram_url}
        viber={shelter.viber_url}
        telegram={shelter.telegram_url}
      />
    </>
  );
}

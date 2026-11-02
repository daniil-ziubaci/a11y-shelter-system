import { ShelterNav } from "@/app/[locale]/shelter/[slug]/shelter-nav";
import { getShelter } from "@/lib/getShelter";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ShelterFooter } from "@/components/ShelterFooter";

export default async function ShelterLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const shelter = await getShelter(slug);

  return (
    <>
      <header className="sticky top-0 z-30 w-full bg-(--background) shadow-md">
        <div className="relative mx-auto flex w-full max-w-5xl items-center justify-between gap-x-4 px-4 py-1">
          <Link
            href={`/shelter/${slug}`}
            className="py-2 text-lg font-bold"
          >
            {shelter.name}
          </Link>
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
      {children}

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
        instagram={shelter.instagram_url}
        viber={shelter.viber_url}
        telegram={shelter.telegram_url}
      />
    </>
  );
}

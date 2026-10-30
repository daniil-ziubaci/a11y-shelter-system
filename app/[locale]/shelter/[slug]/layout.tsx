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
        <div className="w-full max-w-5xl mx-auto px-4 py-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <Link
            href={`/shelter/${slug}/catalog`}
            className="text-lg font-bold py-2"
          >
            {shelter.name}
          </Link>
          <div className="lg:order-3">
            <LanguageSwitcher />
          </div>
          <div className="order-last w-full lg:order-2 lg:w-auto">
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
      />
    </>
  );
}

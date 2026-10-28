import { ShelterNav } from "@/app/[locale]/shelter/[slug]/shelter-nav";
import { getShelter } from "@/lib/getShelter";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

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
      <footer className="w-full max-w-5xl mx-auto p-4 mt-auto">
        <p>{shelter.name}</p>
        <Link
          href={`/shelter/${slug}/about`}
          className="underline inline-block py-2"
        >
          {t("about")}
        </Link>
      </footer>
    </>
  );
}

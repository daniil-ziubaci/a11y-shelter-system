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
      <header className="w-full max-w-5xl mx-auto p-4 flex flex-wrap items-center justify-between gap-4">
        <ShelterNav slug={slug} />
        <LanguageSwitcher />
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

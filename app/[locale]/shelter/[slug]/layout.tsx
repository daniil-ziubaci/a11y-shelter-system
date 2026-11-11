import { ShelterNav } from "@/app/[locale]/shelter/[slug]/shelter-nav";
import { ScrollTopLink } from "@/components/ScrollTopLink";
import { getShelter } from "@/lib/getShelter";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ShelterFooter } from "@/components/ShelterFooter";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import type { Metadata } from "next";
import { brandUrl } from "@/lib/brandUrl";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const shelter = await getShelter(slug, locale);
  if (!shelter.brand_path) return {};
  const path = shelter.brand_path;
  return {
    icons: {
      icon: [
        {
          url: brandUrl(path, "icon-32.png"),
          sizes: "32x32",
          type: "image/png",
        },
        {
          url: brandUrl(path, "icon-48.png"),
          sizes: "48x48",
          type: "image/png",
        },
        {
          url: brandUrl(path, "icon-192.png"),
          sizes: "192x192",
          type: "image/png",
        },
      ],
      apple: brandUrl(path, "apple-icon.png"),
    },
  };
}

export default async function ShelterLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  const shelter = await getShelter(slug, locale);
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
        <div className="relative mx-auto flex w-full max-w-5xl items-center justify-between gap-x-4 px-4 py-1 lg:grid lg:grid-cols-[1fr_auto_1fr]">
          <ScrollTopLink
            href={`/shelter/${slug}`}
            className="flex items-center gap-2 py-0 text-base font-bold sm:text-lg lg:justify-self-start"
          >
            {shelter.brand_path && (
              <Image
                src={brandUrl(shelter.brand_path, "logo.png")}
                alt=""
                width={56}
                height={56}
                unoptimized
                className="size-12 shrink-0 rounded-lg border-[1.2px] border-(--border-strong)"
              />
            )}
            <span className="max-w-48 text-balance leading-tight">
              {shelter.name}
            </span>
          </ScrollTopLink>
          <div className="flex items-center gap-3 lg:order-3 lg:justify-self-end">
            <div className="hidden lg:block">
              <LanguageSwitcher />
            </div>
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
        email={shelter.contact_email}
        messenger={shelter.contact_messenger}
        hours={shelter.contact_hours}
        address={shelter.address}
        city={shelter.city}
        foundedYear={shelter.founded_year}
        legalInfo={shelter.legal_info}
        hoursLanguage={
          shelter.translated.hours ? locale : shelter.content_language
        }
        legalInfoLanguage={
          shelter.translated.legalInfo ? locale : shelter.content_language
        }
        contentLanguage={shelter.content_language}
        instagram={shelter.instagram_url}
        facebook={shelter.facebook_url}
        whatsapp={shelter.whatsapp_url}
        viber={shelter.viber_url}
        telegram={shelter.telegram_url}
      />
    </>
  );
}

import { routing } from "@/i18n/routing";
import type { Metadata } from "next";

export function buildAlternates(locale: string, path: string) {
  const languages: Record<string, string> = {};
  for (const code of routing.locales) {
    languages[code] = `/${code}${path}`;
  }
  languages["x-default"] = `/${routing.defaultLocale}${path}`;

  return {
    canonical: `/${locale}${path}`,
    languages,
  };
}

const OG_LOCALES: Record<string, string> = {
  ru: "ru_RU",
  ro: "ro_RO",
  en: "en_US",
};

export function buildSocialMetadata({
  locale,
  path,
  title,
  description,
  siteName,
  image,
}: {
  locale: string;
  path: string;
  title: string;
  description: string;
  siteName: string;
  image?: { url: string; alt: string };
}): Pick<Metadata, "openGraph" | "twitter"> {
  return {
    openGraph: {
      type: "website",
      url: `/${locale}${path}`,
      siteName,
      locale: OG_LOCALES[locale],
      title,
      description,
      images: image
        ? [
            {
              url: image.url,
              width: 1200,
              height: 630,
              alt: image.alt,
              type: "image/jpeg",
            },
          ]
        : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [{ url: image.url, alt: image.alt }] : undefined,
    },
  };
}

export function getShelterPreviewImage(shelter: {
  slug: string;
  photo_path: string | null;
  photo_alt: string | null;
}) {
  if (!shelter.photo_path || !shelter.photo_alt) {
    return undefined;
  }
  return { url: `/api/og/shelter/${shelter.slug}`, alt: shelter.photo_alt };
}

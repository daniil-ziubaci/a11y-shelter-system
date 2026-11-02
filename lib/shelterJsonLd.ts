type ShelterForJsonLd = {
  name: string;
  city: string | null;
  address: string | null;
  contact_phone: string | null;
  instagram_url: string | null;
  viber_url: string | null;
  telegram_url: string | null;
};

export function buildShelterJsonLd(shelter: ShelterForJsonLd, url: string) {
  const sameAs = [
    shelter.instagram_url,
    shelter.viber_url,
    shelter.telegram_url,
  ].filter((link): link is string => Boolean(link));

  return {
    "@context": "https://schema.org",
    "@type": "AnimalShelter",
    name: shelter.name,
    url,
    ...(sameAs.length > 0 ? { sameAs } : {}),
    ...(shelter.contact_phone ? { telephone: shelter.contact_phone } : {}),
    ...(shelter.city || shelter.address
      ? {
          address: {
            "@type": "PostalAddress",
            ...(shelter.city ? { addressLocality: shelter.city } : {}),
            ...(shelter.address ? { streetAddress: shelter.address } : {}),
          },
        }
      : {}),
  };
}

type ShelterForJsonLd = {
  name: string;
  city: string | null;
  address: string | null;
  contact_phone: string | null;
};

export function buildShelterJsonLd(shelter: ShelterForJsonLd, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "AnimalShelter",
    name: shelter.name,
    url,
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

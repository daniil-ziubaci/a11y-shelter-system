import { getTranslations } from "next-intl/server";
import { siInstagram, siTelegram, siViber } from "simple-icons";

export async function SocialLinks({
  instagram,
  viber,
  telegram,
}: {
  instagram: string | null;
  viber: string | null;
  telegram: string | null;
}) {
  const t = await getTranslations("Footer");
  const networks = [
    {
      name: "Instagram",
      icon: siInstagram,
      color: siInstagram.hex,
      url: instagram,
    },
    { name: "Viber", icon: siViber, color: siViber.hex, url: viber },
    { name: "Telegram", icon: siTelegram, color: "1E84B6", url: telegram },
  ].flatMap((network) =>
    network.url ? [{ ...network, url: network.url }] : [],
  );

  if (networks.length === 0) {
    return null;
  }

  return (
    <nav
      aria-labelledby="footer-social-heading"
      className="flex flex-col gap-3 pb-1.5"
    >
      <p id="footer-social-heading" className="font-semibold">
        {t("socialHeading")}
      </p>
      <ul className="flex flex-wrap gap-5">
        {networks.map((network) => (
          <li key={network.name} className="flex">
            <a
              href={network.url}
              aria-label={t("socialLink", { network: network.name })}
              className="inline-flex size-14 items-center justify-center rounded-full transition-opacity duration-200 hover:opacity-70 motion-reduce:transition-none"
              style={{ color: `#${network.color}` }}
              rel="noopener noreferrer"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-14"
              >
                <path d={network.icon.path} />
              </svg>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

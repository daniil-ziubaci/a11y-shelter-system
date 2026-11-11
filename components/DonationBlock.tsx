import { getTranslations } from "next-intl/server";

export async function DonationBlock({
  text,
  paymentUrl,
  paypalEmail,
  lang,
}: {
  text: string | null;
  paymentUrl: string | null;
  paypalEmail: string | null;
  lang: string;
}) {
  const t = await getTranslations("Needs");

  if (!text && !paymentUrl && !paypalEmail) {
    return null;
  }

  return (
    <section
      id="help-money"
      aria-labelledby="donation-heading"
      className="flex flex-col gap-4 rounded-2xl border-[1.2px] border-(--border-strong) bg-(--surface) p-6 shadow-md"
    >
      <h2 id="donation-heading" className="text-xl font-bold">
        {t("donationHeading")}
      </h2>
      {text && (
        <p lang={lang} className="whitespace-pre-line">
          {text}
        </p>
      )}
      {paymentUrl && (
        <a
          href={paymentUrl}
          rel="noopener noreferrer"
          className="inline-flex min-h-14 max-w-full items-center justify-start self-start rounded-full bg-(--accent) px-6 py-3 text-left text-lg font-semibold text-(--accent-contrast) hover:shadow-md"
        >
          {t("donationPay")}
        </a>
      )}
      {paypalEmail && (
        <p>
          {t("donationPaypal")}{" "}
          <span className="font-semibold break-all">{paypalEmail}</span>
        </p>
      )}
    </section>
  );
}

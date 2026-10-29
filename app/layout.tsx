import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { getLocale } from "next-intl/server";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin", "latin-ext", "cyrillic"],
  display: "swap",
});

const siteUrl = process.env.SITE_URL;
if (!siteUrl) {
  throw new Error("Не задана переменная окружения SITE_URL");
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Приют для животных",
  description: "Каталог животных, которые ищут дом, и помощь приюту.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html lang={locale} className={`${nunito.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="w-full max-w-5xl mx-auto p-4">
          <nav aria-label="Основная навигация">
            <Link href="/catalog" className="underline inline-block py-2">
              Животные ищут дом
            </Link>
          </nav>
        </header>
        {children}
        <footer className="w-full max-w-5xl mx-auto p-4 mt-auto">
          Приют для животных
        </footer>
      </body>
    </html>
  );
}

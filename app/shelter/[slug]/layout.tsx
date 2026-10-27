import { getShelter } from "@/lib/getShelter";
import Link from "next/link";

export default async function ShelterLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const shelter = await getShelter(slug);

  return (
    <>
      <header className="w-full max-w-5xl mx-auto p-4">
        <nav aria-label="Основная навигация" className="flex flex-wrap gap-4">
          <Link
            href={`/shelter/${slug}/catalog`}
            className="underline inline-block py-2"
          >
            Животные ищут дом
          </Link>
          <Link
            href={`/shelter/${slug}/treatment`}
            className="underline inline-block py-2"
          >
            Нужна помощь с лечением
          </Link>
          <Link
            href={`/shelter/${slug}/about`}
            className="underline inline-block py-2"
          >
            О приюте
          </Link>
        </nav>
      </header>
      {children}
      <footer className="w-full max-w-5xl mx-auto p-4 mt-auto">
        <p>{shelter.name}</p>
        <Link
          href={`/shelter/${slug}/about`}
          className="underline inline-block py-2"
        >
          О приюте
        </Link>
      </footer>
    </>
  );
}

import Link from "next/link";

export default function NotFound() {
  return (
    <main className="w-full flex flex-col items-center gap-4 p-8 max-w-3xl mx-auto text-center">
      <title>Страница не найдена</title>
      <h1 className="text-3xl font-bold">Мы не нашли такую страницу</h1>
      <p>
        Возможно, ссылка устарела или в адресе опечатка. Это бывает. Давайте
        вернёмся на главную.
      </p>
      <Link
        href="/"
        className="inline-flex min-h-11 items-center justify-center rounded-full bg-(--accent) px-5 py-2 font-semibold text-(--accent-contrast) hover:shadow-md"
      >
        Вернуться на главную
      </Link>
    </main>
  );
}

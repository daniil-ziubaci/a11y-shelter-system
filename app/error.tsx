"use client";

import Link from "next/link";

export default function RootError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <main className="w-full flex flex-col items-center gap-4 p-8 max-w-3xl mx-auto text-center">
      <title>Что-то пошло не так</title>
      <h1 className="text-3xl font-bold">Что-то пошло не так</h1>
      <p role="alert">
        Это не ваша вина: на нашей стороне случилась ошибка. Попробуйте ещё раз,
        а если не получится, вернитесь на главную.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={unstable_retry}
          className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full bg-(--accent) px-5 py-2 font-semibold text-(--accent-contrast) hover:shadow-md"
        >
          Попробовать снова
        </button>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-(--border) bg-(--surface) px-5 py-2 font-semibold text-(--accent) hover:shadow-md"
        >
          Вернуться на главную
        </Link>
      </div>
    </main>
  );
}

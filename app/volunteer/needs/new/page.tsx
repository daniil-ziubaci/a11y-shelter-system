import { NewNeedForm } from "@/app/volunteer/needs/new/new-need-form";

export const metadata = {
  title: "Добавить позицию в план закупок",
  robots: { index: false },
};

export default function NewNeedPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 pb-8 pt-1">
      <h1 className="text-3xl font-bold sm:text-center">Добавить позицию в план закупок</h1>
      <NewNeedForm />
    </main>
  );
}

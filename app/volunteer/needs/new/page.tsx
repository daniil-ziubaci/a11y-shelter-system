import { NewNeedForm } from "@/app/volunteer/needs/new/new-need-form";

export const metadata = {
  title: "Добавить позицию в план закупок",
  robots: { index: false },
};

export default function NewNeedPage() {
  return (
    <main className="w-full flex flex-col gap-6 p-4 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold">Добавить позицию в план закупок</h1>
      <NewNeedForm />
    </main>
  );
}

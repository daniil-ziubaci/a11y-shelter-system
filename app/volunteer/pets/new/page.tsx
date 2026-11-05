import { NewPetForm } from "@/app/volunteer/pets/new/new-pet-form";

export const metadata = {
  title: "Добавить животное",
  robots: { index: false },
};

export default function NewPetPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 pb-8 pt-1">
      <h1 className="text-3xl font-bold wrap-break-word sm:mx-auto sm:w-[calc(50%-0.5rem)] sm:text-center">Добавить животное</h1>
      <NewPetForm />
    </main>
  );
}

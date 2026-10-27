import { NewPetForm } from "@/app/volunteer/pets/new/new-pet-form";

export const metadata = {
  title: "Добавить животное",
  robots: { index: false },
};

export default function NewPetPage() {
  return (
    <main className="w-full flex flex-col gap-6 p-4 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold">Добавить животное</h1>
      <NewPetForm />
    </main>
  );
}

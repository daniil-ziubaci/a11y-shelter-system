import { NewProjectForm } from "@/app/volunteer/projects/new/new-project-form";

export const metadata = {
  title: "Добавить проект",
  robots: { index: false },
};

export default function NewProjectPage() {
  return (
    <main className="w-full flex flex-col gap-6 p-4 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold">Добавить проект</h1>
      <NewProjectForm />
    </main>
  );
}

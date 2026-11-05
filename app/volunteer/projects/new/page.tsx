import { NewProjectForm } from "@/app/volunteer/projects/new/new-project-form";

export const metadata = {
  title: "Добавить проект",
  robots: { index: false },
};

export default function NewProjectPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 pb-8 pt-1">
      <h1 className="text-3xl font-bold wrap-break-word sm:mx-auto sm:w-[calc(50%-0.5rem)] sm:text-center">Добавить проект</h1>
      <NewProjectForm />
    </main>
  );
}

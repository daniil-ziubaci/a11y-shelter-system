import { EditProjectForm } from "@/app/volunteer/projects/[id]/edit/edit-project-form";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Редактирование проекта",
  robots: { index: false },
};

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("shelter_members")
    .select("shelter_id")
    .limit(1)
    .maybeSingle();

  if (!membership) {
    return <p role="alert">Вы не состоите ни в одном приюте.</p>;
  }

  const { data: project, error } = await supabase
    .from("projects")
    .select("id, title, description, goal, stage")
    .eq("id", id)
    .eq("shelter_id", membership.shelter_id)
    .maybeSingle();

  if (error) {
    return <p role="alert">Не удалось загрузить проект.</p>;
  }

  if (!project) {
    return <p role="alert">Проект не найден.</p>;
  }

  return (
    <main className="w-full flex flex-col gap-6 p-4 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold">Редактирование: {project.title}</h1>
      <EditProjectForm project={project} />
    </main>
  );
}

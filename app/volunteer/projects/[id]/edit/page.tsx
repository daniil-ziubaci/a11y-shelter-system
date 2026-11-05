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
    .select(
      "id, title, description, help_kinds, photo_path, photo_alt, progress_total, progress_done, progress_unit",
    )
    .eq("id", id)
    .eq("shelter_id", membership.shelter_id)
    .maybeSingle();

  if (error) {
    return <p role="alert">Не удалось загрузить проект.</p>;
  }

  if (!project) {
    return <p role="alert">Проект не найден.</p>;
  }

  const photoUrl = project.photo_path
    ? supabase.storage.from("pet-photos").getPublicUrl(project.photo_path)
        .data.publicUrl
    : null;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 pb-8 pt-1">
      <h1 className="text-3xl font-bold sm:text-center">Редактирование: {project.title}</h1>
      <EditProjectForm project={project} photoUrl={photoUrl} />
    </main>
  );
}

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Проекты приюта",
  robots: { index: false },
};

export default async function VolunteerProjectsPage() {
  const supabase = await createClient();
  const { data: membership } = await supabase
    .from("shelter_members")
    .select("shelter_id, shelters(name)")
    .limit(1)
    .maybeSingle();

  if (!membership) {
    return (
      <main className="w-full flex flex-col gap-6 p-4 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold">Проекты приюта</h1>
        <p>Вы пока не состоите ни в одном приюте. Обратитесь к координатору.</p>
      </main>
    );
  }

  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, title, goal, status")
    .eq("shelter_id", membership.shelter_id)
    .order("created_at", { ascending: false });

  return (
    <main className="w-full flex flex-col gap-6 p-4 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold">Проекты приюта</h1>
      <p>Приют: {membership.shelters?.name}</p>
      <Link
        href="/volunteer/projects/new"
        className="underline inline-block py-2"
      >
        Добавить проект
      </Link>
      {error ? (
        <p role="alert">Не удалось загрузить проекты.</p>
      ) : !projects || projects.length === 0 ? (
        <p>Проектов пока нет.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {projects.map((project) => (
            <li
              key={project.id}
              className="flex flex-col gap-1 rounded border p-4"
            >
              <h2 className="text-xl font-bold">{project.title}</h2>
              <p>Статус: {project.status}</p>
              {project.goal && <p>Цель: {project.goal}</p>}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

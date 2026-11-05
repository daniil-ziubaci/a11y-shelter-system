import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PROJECT_STATUS_ONGOING, PROJECT_STATUSES } from "@/lib/projectStages";
import {
  setProjectProgress,
  setProjectStatus,
} from "@/app/volunteer/projects/actions";
import { setProjectArchived } from "@/app/volunteer/archive/actions";
import { isProjectStale, PROJECT_REVIEW_DAYS } from "@/lib/projectReview";
import { SelectWrap } from "@/components/SelectWrap";

export const metadata = {
  title: "Проекты приюта",
  robots: { index: false },
};

const box = "mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 pb-6 pt-4";

type ProjectRow = {
  id: string;
  title: string;
  status: string;
  updated_at: string;
  progress_total: number | null;
  progress_done: number | null;
  progress_unit: string | null;
};

function ArchiveForm({
  project,
  archived,
}: {
  project: ProjectRow;
  archived: boolean;
}) {
  return (
    <form action={setProjectArchived}>
      <input type="hidden" name="id" value={project.id} />
      <input type="hidden" name="archived" value={archived ? "0" : "1"} />
      <button
        type="submit"
        aria-label={`${archived ? "Вернуть в список" : "Убрать из списка"}: ${project.title}`}
        className="h-10 w-full cursor-pointer rounded-lg px-3 text-[15px] font-medium text-(--muted) underline"
      >
        {archived ? "Вернуть в список" : "Убрать из списка"}
      </button>
    </form>
  );
}

function ProjectCard({ project }: { project: ProjectRow }) {
  const hasProgress =
    project.progress_total !== null &&
    project.progress_done !== null &&
    Boolean(project.progress_unit);

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-(--border) bg-(--surface) p-3 shadow-[0_2px_10px_rgba(90,50,20,0.22)]">
      <h3 className="text-xl font-bold wrap-break-word">{project.title}</h3>
      {project.status === PROJECT_STATUS_ONGOING &&
        isProjectStale(project.updated_at) && (
          <p className="rounded-lg bg-(--pending-soft) px-3 py-2 font-semibold text-(--pending)">
            Проверьте, актуально ли: проект не обновлялся больше{" "}
            {PROJECT_REVIEW_DAYS} дней.
          </p>
        )}
      <div className="mt-auto flex flex-col gap-3">
        {hasProgress ? (
          <form action={setProjectProgress} className="flex flex-col gap-1">
            <input type="hidden" name="projectId" value={project.id} />
            <label htmlFor={`done-${project.id}`} className="text-(--muted)">
              Сделано из {project.progress_total} {project.progress_unit}:
            </label>
            <div className="flex gap-2">
              <input
                id={`done-${project.id}`}
                name="progressDone"
                type="number"
                inputMode="numeric"
                min={0}
                max={project.progress_total ?? undefined}
                defaultValue={project.progress_done ?? 0}
                aria-label={`Сделано из ${project.progress_total} ${project.progress_unit}: ${project.title}`}
                className="h-10 min-w-0 flex-1 rounded-lg border border-(--border-strong) bg-(--surface) px-3 text-base"
              />
              <button
                type="submit"
                aria-label={`Сохранить счёт дел: ${project.title}`}
                className="h-10 cursor-pointer rounded-lg border border-(--border-strong) bg-(--surface) px-4 font-medium"
              >
                Сохранить
              </button>
            </div>
          </form>
        ) : (
          <form action={setProjectStatus} className="flex gap-2">
            <input type="hidden" name="projectId" value={project.id} />
            <div className="min-w-0 flex-1">
              <SelectWrap>
                <select
                  name="status"
                  defaultValue={project.status}
                  aria-label={`Статус: ${project.title}`}
                  className="h-10 w-full appearance-none rounded-lg border border-(--border-strong) bg-(--surface) pl-3 pr-10 text-base"
                >
                  {PROJECT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </SelectWrap>
            </div>
            <button
              type="submit"
              aria-label={`Сохранить статус: ${project.title}`}
              className="h-10 cursor-pointer rounded-lg border border-(--border-strong) bg-(--surface) px-4 font-medium"
            >
              Сохранить
            </button>
          </form>
        )}
        <Link
          href={`/volunteer/projects/${project.id}/edit`}
          aria-label={`Редактировать: ${project.title}`}
          className="flex h-10 w-full items-center justify-center rounded-lg border border-(--border-strong) bg-(--surface) px-3 text-[15px] font-medium"
        >
          Редактировать
        </Link>
        {project.status !== PROJECT_STATUS_ONGOING && (
          <ArchiveForm project={project} archived={false} />
        )}
      </div>
    </li>
  );
}

export default async function VolunteerProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ archived?: string }>;
}) {
  const { archived: archivedParam } = await searchParams;
  const showArchived = archivedParam === "1";

  const supabase = await createClient();
  const { data: membership } = await supabase
    .from("shelter_members")
    .select("shelter_id")
    .limit(1)
    .maybeSingle();

  if (!membership) {
    return (
      <main className={box}>
        <h1 className="text-3xl font-bold sm:text-center">Проекты приюта</h1>
        <p>Вы пока не состоите ни в одном приюте. Обратитесь к координатору.</p>
      </main>
    );
  }

  const { data, error } = await supabase
    .from("projects")
    .select(
      "id, title, status, updated_at, progress_total, progress_done, progress_unit",
    )
    .eq("shelter_id", membership.shelter_id)
    .eq("is_archived", showArchived)
    .order("created_at", { ascending: false });

  const projects = data ?? [];
  const ongoing = projects.filter((p) => p.status === PROJECT_STATUS_ONGOING);
  const completed = projects.filter((p) => p.status !== PROJECT_STATUS_ONGOING);

  if (showArchived) {
    return (
      <main className={box}>
        <h1 className="text-3xl font-bold sm:text-center">Убранные проекты</h1>
        {error ? (
          <p role="alert">Не удалось загрузить проекты.</p>
        ) : projects.length === 0 ? (
          <p className="text-(--muted) sm:text-center">
            Убранных проектов нет.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {projects.map((project) => (
              <li
                key={project.id}
                className="flex flex-col gap-3 rounded-2xl border border-(--border) bg-(--surface) p-3 shadow-[0_2px_10px_rgba(90,50,20,0.22)]"
              >
                <h2 className="text-xl font-bold wrap-break-word">
                  {project.title}
                </h2>
                <ArchiveForm project={project} archived />
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/volunteer/projects"
          className="flex h-10 items-center justify-center text-(--muted) underline sm:self-center"
        >
          К проектам
        </Link>
      </main>
    );
  }

  return (
    <main className={box}>
      <h1 className="text-3xl font-bold sm:text-center">Проекты приюта</h1>
      <Link
        href="/volunteer/projects/new"
        className="flex h-10 items-center justify-center rounded-lg border border-(--border-strong) bg-(--surface) px-4 font-medium sm:self-center"
      >
        Добавить проект
      </Link>
      {error ? (
        <p role="alert">Не удалось загрузить проекты.</p>
      ) : projects.length === 0 ? (
        <p className="text-(--muted)">Проектов пока нет.</p>
      ) : (
        <>
          {ongoing.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-bold text-(--muted)">Идут сейчас</h2>
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {ongoing.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </ul>
            </section>
          )}
          {completed.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-bold text-(--muted)">Завершены</h2>
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {completed.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}
      <Link
        href="/volunteer/projects?archived=1"
        className="flex h-10 items-center justify-center text-(--muted) underline sm:self-center"
      >
        Показать убранные
      </Link>
    </main>
  );
}

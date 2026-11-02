import Image from "next/image";
import { getShelter } from "@/lib/getShelter";
import { ProjectDescription } from "@/components/ProjectDescription";
import {
  getStageKey,
  PROJECT_STATUS_COMPLETED,
  PROJECT_STATUS_ONGOING,
} from "@/lib/projectStages";
import { buildAlternates } from "@/lib/seo";
import { createClient } from "@/lib/supabase/server";
import { getFormatter, getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  const shelter = await getShelter(slug);
  const t = await getTranslations({ locale, namespace: "Projects" });
  return {
    title: t("title", { shelter: shelter.name }),
    description: t("description", { shelter: shelter.name }),
    alternates: buildAlternates(locale, `/shelter/${slug}/projects`),
  };
}

export default async function ShelterProjectsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const shelter = await getShelter(slug);
  const t = await getTranslations("Projects");
  const format = await getFormatter();
  const supabase = await createClient();
  const { data: projects, error } = await supabase
    .from("projects")
    .select(
      "id, title, description, goal, status, stage, completed_at, is_pinned, help_kinds, photo_path, photo_alt, progress_total, progress_done, progress_unit",
    )
    .eq("shelter_id", shelter.id)
    .order("completed_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="w-full flex flex-col gap-6 p-4 max-w-5xl mx-auto">
        <p role="alert">{t("loadError")}</p>
      </main>
    );
  }

  const ongoing = (projects ?? [])
    .filter((p) => p.status === PROJECT_STATUS_ONGOING)
    .sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned));

  const completed = (projects ?? []).filter(
    (p) => p.status === PROJECT_STATUS_COMPLETED,
  );

  const renderProject = (project: (typeof ongoing)[number]) => (
    <li
      key={project.id}
      className={`flex flex-col gap-3 rounded-2xl border border-(--border-strong) p-5 sm:flex-row sm:gap-6 ${
        project.is_pinned ? "bg-(--accent-soft)" : "bg-(--surface)"
      }`}
    >
      {project.photo_path && project.photo_alt && (
        <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-(--hover) sm:w-2/5 sm:shrink-0 sm:self-start">
          <Image
            src={
              supabase.storage
                .from("pet-photos")
                .getPublicUrl(project.photo_path).data.publicUrl
            }
            alt={project.photo_alt}
            fill
            sizes="(min-width: 640px) 40vw, 100vw"
            className="object-cover"
          />
        </div>
      )}

      <div className="flex flex-1 flex-col gap-3">
        {project.is_pinned && (
          <p className="inline-flex items-center gap-2 self-start rounded-full border border-(--accent) bg-(--surface) px-3 py-1 text-sm font-medium text-(--accent)">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-current"
            />
            {t("pinnedBadge")}
          </p>
        )}
        <h3 className="text-2xl font-bold leading-tight sm:text-3xl">
          {project.title}
        </h3>
        <ProjectDescription text={project.description} />
        {project.status === PROJECT_STATUS_ONGOING &&
          project.progress_total !== null &&
          project.progress_done !== null &&
          project.progress_unit && (
            <div className="flex flex-col gap-2">
              <p className="text-lg font-semibold">
                {t("progressText", {
                  done: project.progress_done,
                  total: project.progress_total,
                  unit: project.progress_unit,
                  left: project.progress_total - project.progress_done,
                })}
              </p>
              <div
                aria-hidden="true"
                className="h-3 w-full overflow-hidden rounded-full border border-(--border-strong) bg-(--hover)"
              >
                <div
                  className="h-full bg-(--accent)"
                  style={{
                    width: `${Math.round(
                      (project.progress_done / project.progress_total) * 100,
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}
        {!(
          project.status === PROJECT_STATUS_ONGOING &&
          project.progress_total !== null
        ) &&
          (project.goal ||
            (project.status === PROJECT_STATUS_ONGOING &&
              !project.is_pinned &&
              getStageKey(project.stage))) && (
            <dl className="flex flex-col gap-1 border-l-4 border-(--accent) pl-4">
              {project.goal && (
                <div>
                  <dt className="inline font-bold">
                    {project.status === PROJECT_STATUS_COMPLETED && (
                      <span aria-hidden="true">✓ </span>
                    )}
                    {t(
                      project.status === PROJECT_STATUS_COMPLETED
                        ? "goalAchievedLabel"
                        : "goalLabel",
                    )}{" "}
                  </dt>
                  <dd className="inline">{project.goal}</dd>
                </div>
              )}
              {project.status === PROJECT_STATUS_ONGOING &&
                !project.is_pinned &&
                getStageKey(project.stage) && (
                  <div>
                    <dt className="inline font-bold">{t("stageTitle")} </dt>
                    <dd className="inline">
                      {t(`stages.${getStageKey(project.stage)}`)}
                    </dd>
                  </div>
                )}
            </dl>
          )}
        {project.status === PROJECT_STATUS_ONGOING && (
          <ul aria-label={t("helpKindsLabel")} className="flex flex-wrap gap-2">
            {project.help_kinds.map((kind) => (
              <li
                key={kind}
                className="rounded-full border border-(--accent) bg-(--accent-soft) px-3 py-1.5 text-sm font-semibold text-(--accent)"
              >
                {t(`helpKinds.${kind}`)}
              </li>
            ))}
          </ul>
        )}
        {project.completed_at && (
          <p className="text-(--muted)">
            {t("completedOn", {
              date: format.dateTime(new Date(project.completed_at), {
                dateStyle: "long",
                timeZone: "UTC",
              }),
            })}
          </p>
        )}
        {project.status === PROJECT_STATUS_ONGOING && (
          <a
            href="#footer-contact-heading"
            aria-label={t(
              project.is_pinned ? "supportProgramLabel" : "helpLabel",
              { name: project.title },
            )}
            className="mt-auto flex min-h-11 w-full items-center justify-center rounded-full bg-(--accent) px-5 text-lg font-semibold text-(--accent-contrast) sm:inline-flex sm:w-auto sm:self-start"
          >
            {t(project.is_pinned ? "supportProgram" : "help")}
          </a>
        )}
      </div>
    </li>
  );

  return (
    <main className="w-full flex flex-col gap-6 p-4 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-center">
        {t("heading", { shelter: shelter.name })}
      </h1>
      <p className="-mt-3 text-center text-lg text-(--muted)">{t("intro")}</p>
      {!projects || projects.length === 0 ? (
        <p>{t("none")}</p>
      ) : (
        <>
          <section
            aria-labelledby="ongoing-heading"
            className="flex flex-col gap-4"
          >
            <h2 id="ongoing-heading" className="text-2xl font-bold">
              {t("ongoingHeading")}
            </h2>
            {ongoing.length === 0 ? (
              <p>{t("noOngoing")}</p>
            ) : (
              <ul className="flex flex-col gap-6">
                {ongoing.map(renderProject)}
              </ul>
            )}
          </section>
          {completed.length > 0 && (
            <section
              aria-labelledby="completed-heading"
              className="flex flex-col gap-4"
            >
              <h2 id="completed-heading" className="text-2xl font-bold">
                {t("completedHeading")}
              </h2>
              <ul className="flex flex-col gap-6">
                {completed.map(renderProject)}
              </ul>
            </section>
          )}
        </>
      )}
    </main>
  );
}

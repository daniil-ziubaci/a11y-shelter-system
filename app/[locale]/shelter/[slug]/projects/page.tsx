import { getShelter } from "@/lib/getShelter";
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
    .select("id, title, description, goal, status, stage, completed_at")
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

  const ongoing = (projects ?? []).filter(
    (p) => p.status === PROJECT_STATUS_ONGOING,
  );
  const completed = (projects ?? []).filter(
    (p) => p.status === PROJECT_STATUS_COMPLETED,
  );

  const renderProject = (project: (typeof ongoing)[number]) => (
    <li
      key={project.id}
      className="flex flex-col gap-2 rounded-lg border border-(--border-strong) bg-(--surface) p-4"
    >
      <h3 className="text-xl font-bold">{project.title}</h3>
      <p className="whitespace-pre-line">{project.description}</p>
      {project.goal && (
        <p className="text-(--muted)">{t("goal", { goal: project.goal })}</p>
      )}
      {project.status === PROJECT_STATUS_ONGOING &&
        getStageKey(project.stage) && (
          <p className="font-medium">
            {t("stageLabel", {
              stage: t(`stages.${getStageKey(project.stage)}`),
            })}
          </p>
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
          aria-label={t("helpLabel", { name: project.title })}
          className="underline inline-block py-2"
        >
          {t("help")}
        </a>
      )}
    </li>
  );

  return (
    <main className="w-full flex flex-col gap-6 p-4 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-center">{t("heading")}</h1>
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
              <ul className="flex flex-col gap-4">
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
              <ul className="flex flex-col gap-4">
                {completed.map(renderProject)}
              </ul>
            </section>
          )}
        </>
      )}
    </main>
  );
}

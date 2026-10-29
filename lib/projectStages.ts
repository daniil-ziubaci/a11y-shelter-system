export const PROJECT_STAGES = ["готовим", "в работе", "почти готово"] as const;

export type ProjectStage = (typeof PROJECT_STAGES)[number];

export const DEFAULT_PROJECT_STAGE: ProjectStage = "в работе";

const STAGE_KEYS: Record<ProjectStage, string> = {
  "готовим": "preparing",
  "в работе": "inProgress",
  "почти готово": "almostDone",
};

export function getStageKey(stage: string): string | null {
  return (STAGE_KEYS as Record<string, string>)[stage] ?? null;
}

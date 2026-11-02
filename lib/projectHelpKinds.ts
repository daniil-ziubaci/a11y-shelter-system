export const PROJECT_HELP_KINDS = ["things", "money"] as const;

export type ProjectHelpKind = (typeof PROJECT_HELP_KINDS)[number];

export const DEFAULT_PROJECT_HELP_KINDS: ProjectHelpKind[] = ["money"];

export const PROJECT_HELP_KIND_LABELS: Record<ProjectHelpKind, string> = {
  things: "Вещи",
  money: "Деньги",
};

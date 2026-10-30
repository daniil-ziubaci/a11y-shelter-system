export const PROJECT_REVIEW_DAYS = 7;

export function isProjectStale(updatedAt: string | null): boolean {
  if (!updatedAt) return false;
  const ageMs = Date.now() - new Date(updatedAt).getTime();
  return ageMs > PROJECT_REVIEW_DAYS * 24 * 60 * 60 * 1000;
}
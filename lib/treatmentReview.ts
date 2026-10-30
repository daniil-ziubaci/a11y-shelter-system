export const TREATMENT_REVIEW_DAYS = 7;

export function isTreatmentStale(since: string | null): boolean {
  if (!since) return false;
  const ageMs = Date.now() - new Date(since).getTime();
  return ageMs > TREATMENT_REVIEW_DAYS * 24 * 60 * 60 * 1000;
}
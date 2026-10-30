const REVIEW_STATUSES = ["в процессе", "на лечении"];

export const PET_STATUS_REVIEW_DAYS = 7;

export function isPetStatusStale(
  status: string,
  changedAt: string | null,
): boolean {
  if (!changedAt) return false;
  if (!REVIEW_STATUSES.includes(status)) return false;
  const ageMs = Date.now() - new Date(changedAt).getTime();
  return ageMs > PET_STATUS_REVIEW_DAYS * 24 * 60 * 60 * 1000;
}

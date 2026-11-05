export const VOLUNTEER_SORTS = ["name", "new", "stale"] as const;

export type VolunteerSort = (typeof VOLUNTEER_SORTS)[number];

export function parseVolunteerSort(value: string | undefined): VolunteerSort {
  return VOLUNTEER_SORTS.find((sort) => sort === value) ?? "name";
}

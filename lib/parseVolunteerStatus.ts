import {
  PET_STATUS_ADOPTED,
  PET_STATUS_LOOKING,
  PET_STATUS_PENDING,
  PET_STATUS_REMOVED,
  PET_STATUS_TREATMENT,
} from "@/lib/petStatuses";

export const VOLUNTEER_STATUS_FILTERS = {
  looking: [PET_STATUS_LOOKING],
  pending: [PET_STATUS_PENDING],
  treatment: [PET_STATUS_TREATMENT],
  archive: [PET_STATUS_ADOPTED, PET_STATUS_REMOVED],
} as const;

export type VolunteerStatusFilter = keyof typeof VOLUNTEER_STATUS_FILTERS;

export function parseVolunteerStatus(
  value: string | undefined,
): VolunteerStatusFilter | undefined {
  const keys = Object.keys(VOLUNTEER_STATUS_FILTERS) as VolunteerStatusFilter[];
  return keys.find((key) => key === value);
}

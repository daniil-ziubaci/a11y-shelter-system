export const PET_STATUS_LOOKING = "ищет дом";
export const PET_STATUS_PENDING = "в процессе";
export const PET_STATUS_TREATMENT = "на лечении";
export const PET_STATUS_ADOPTED = "пристроен";
export const PET_STATUS_REMOVED = "снят с учёта";

export const PET_STATUSES = [
  PET_STATUS_LOOKING,
  PET_STATUS_PENDING,
  PET_STATUS_TREATMENT,
  PET_STATUS_ADOPTED,
  PET_STATUS_REMOVED,
] as const;

export const PUBLIC_PET_STATUSES = [
  PET_STATUS_LOOKING,
  PET_STATUS_PENDING,
  PET_STATUS_TREATMENT,
];

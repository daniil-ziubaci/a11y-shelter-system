import { getStatusKey } from "@/lib/petLabels";
import { PET_STATUS_LOOKING, PET_STATUS_TREATMENT } from "@/lib/petStatuses";
import { useTranslations } from "next-intl";

export function PetBadges({
  status,
  needsTreatmentSince,
}: {
  status: string;
  needsTreatmentSince: string | null;
}) {
  const t = useTranslations("Pet");
  const statusKey = getStatusKey(status);
  const showStatusBadge = status !== PET_STATUS_LOOKING;
  const isInTreatment = status === PET_STATUS_TREATMENT;

  return (
    <>
      {needsTreatmentSince && (
        <p className="inline-flex items-center gap-1.5 rounded-full bg-(--danger-soft) px-2.5 py-0.5 text-sm font-medium text-(--danger) shadow-sm ring-1 ring-(--border)">
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full bg-(--danger)"
          />
          {t("needsTreatmentBadge")}
        </p>
      )}
      {showStatusBadge && (
        <p
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-sm font-medium shadow-sm ring-1 ${
            isInTreatment
              ? "bg-(--hover) text-(--muted) ring-(--border-strong)"
              : "bg-(--pending-soft) text-(--pending) ring-(--border)"
          }`}
        >
          <span
            aria-hidden="true"
            className={`size-1.5 rounded-full ${
              isInTreatment ? "bg-(--muted)" : "bg-(--pending)"
            }`}
          />
          {statusKey ? t(`status.${statusKey}`) : status}
        </p>
      )}
    </>
  );
}

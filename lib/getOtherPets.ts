import { PET_STATUS_TREATMENT, PUBLIC_PET_STATUSES } from "@/lib/petStatuses";
import { createClient } from "@/lib/supabase/server";
import { toPet } from "@/lib/toPet";

export async function getOtherPets(
  shelterId: string,
  excludeId: string,
  locale: string,
  onlyTreatment = false,
) {
  const supabase = await createClient();
  let query = supabase
    .from("pets")
    .select("*")
    .eq("shelter_id", shelterId)
    .in("status", PUBLIC_PET_STATUSES)
    .neq("id", excludeId);

  if (onlyTreatment) {
    query = query
      .or(
        `needs_treatment_since.not.is.null,status.eq."${PET_STATUS_TREATMENT}"`,
      )
      .order("needs_treatment_since", { ascending: true, nullsFirst: false });
  }

  const { data, error } = await query
    .order("status_rank")
    .order("created_at", { ascending: true })
    .limit(4);

  if (error) return [];

  return (data ?? []).map((row) => toPet(row, locale));
}

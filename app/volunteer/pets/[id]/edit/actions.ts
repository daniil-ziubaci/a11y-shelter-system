"use server";

import { parsePetFields } from "@/lib/parsePetFields";
import { saveEnclosure } from "@/lib/saveEnclosure";
import { uploadPetPhoto } from "@/lib/uploadPetPhoto";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { translatePet } from "@/lib/translatePet";
import { PET_STATUS_TREATMENT } from "@/lib/petStatuses";

type UpdatePetState =
  | { error: string; values: Record<string, string> }
  | undefined;

export async function updatePet(
  _prevState: UpdatePetState,
  formData: FormData,
): Promise<UpdatePetState> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      values[key] = value;
    }
  }
  const fail = (error: string): UpdatePetState => ({ error, values });

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    return fail("Войдите заново.");
  }

  const { data: membership } = await supabase
    .from("shelter_members")
    .select("shelter_id")
    .limit(1)
    .maybeSingle();

  if (!membership) {
    return fail("Вы не состоите ни в одном приюте.");
  }
  const petId = formData.get("id");
  if (typeof petId !== "string" || !petId) {
    return fail("Не удалось определить животное.");
  }

  const parsed = parsePetFields(formData);
  if (!parsed.ok) {
    return fail(parsed.error);
  }
  const fields = parsed.fields;
  const needsTreatment = formData.get("needsTreatment") === "on";
  const setTreatmentStatus = formData.get("treatmentStatus") === "on";

  let photoUrl: string | undefined;
  const photo = formData.get("photo");

  if (photo instanceof File && photo.size > 0) {
    const uploaded = await uploadPetPhoto(
      supabase,
      `${membership.shelter_id}/animals/${petId}/${crypto.randomUUID()}`,
      formData,
    );
    if (!uploaded.ok) {
      return fail(uploaded.error);
    }

    photoUrl = supabase.storage.from("pet-photos").getPublicUrl(uploaded.path)
      .data.publicUrl;
  }
  const { data: updated, error: updateError } = await supabase
    .from("pets")
    .update({
      name: fields.name,
      species: fields.species,
      sex: fields.sex,
      birth_date: fields.birthDate,
      is_age_approximate: fields.isAgeApproximate,
      size: fields.size,
      health: fields.health,
      ...(setTreatmentStatus ? { status: PET_STATUS_TREATMENT } : {}),
      needs_treatment_since: needsTreatment ? new Date().toISOString() : null,
      description: fields.description,
      photo_alt: fields.photoAlt,
      ...(photoUrl ? { photo_url: photoUrl } : {}),
    })
    .eq("id", petId)
    .eq("shelter_id", membership.shelter_id)
    .select("id")
    .maybeSingle();

  if (updateError || !updated) {
    return fail("Не удалось сохранить животное. Попробуйте ещё раз.");
  }

  after(() => translatePet(petId));
  if (!(await saveEnclosure(supabase, petId, fields.enclosure))) {
    return fail(
      "Животное сохранено, но вольер сохранить не удалось. Попробуйте ещё раз.",
    );
  }
  redirect("/volunteer");
}

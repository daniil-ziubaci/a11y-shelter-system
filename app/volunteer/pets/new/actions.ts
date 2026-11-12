"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { translatePet } from "@/lib/translatePet";
import { createClient } from "@/lib/supabase/server";
import { uploadPetPhoto } from "@/lib/uploadPetPhoto";
import { parsePetFields } from "@/lib/parsePetFields";
import { saveEnclosure } from "@/lib/saveEnclosure";
import { PET_STATUS_TREATMENT } from "@/lib/petStatuses";

type CreatePetState =
  | { error: string; values: Record<string, string> }
  | undefined;

export async function createPet(
  _prevState: CreatePetState,
  formData: FormData,
): Promise<CreatePetState> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      values[key] = value;
    }
  }
  const fail = (error: string): CreatePetState => ({ error, values });

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

  const parsed = parsePetFields(formData);
  if (!parsed.ok) {
    return fail(parsed.error);
  }
  const {
    name,
    species,
    sex,
    health,
    description,
    photoAlt,
    size,
    birthDate,
    isAgeApproximate,
    enclosure,
  } = parsed.fields;

  const needsTreatment = formData.get("needsTreatment") === "on";
  const treatmentStatus = formData.get("treatmentStatus") === "on";

  const photo = formData.get("photo");
  if (!(photo instanceof File) || photo.size === 0) {
    return fail("Выберите фото животного.");
  }

  const petId = crypto.randomUUID();
  const uploaded = await uploadPetPhoto(
    supabase,
    `${membership.shelter_id}/animals/${petId}/photo`,
    formData,
  );
  if (!uploaded.ok) {
    return fail(uploaded.error);
  }

  const { data: urlData } = supabase.storage
    .from("pet-photos")
    .getPublicUrl(uploaded.path);
  const { error: insertError } = await supabase.from("pets").insert({
    id: petId,
    shelter_id: membership.shelter_id,
    name,
    species,
    sex,
    birth_date: birthDate,
    is_age_approximate: isAgeApproximate,
    size,
    health,
    description,
    photo_url: urlData.publicUrl,
    photo_alt: photoAlt,
    ...(treatmentStatus ? { status: PET_STATUS_TREATMENT } : {}),
    needs_treatment_since: needsTreatment ? new Date().toISOString() : null,
  });
  if (insertError) {
    return fail("Не удалось сохранить животное. Попробуйте ещё раз.");
  }

  after(() => translatePet(petId));
  if (enclosure && !(await saveEnclosure(supabase, petId, enclosure))) {
    return fail(
      "Животное добавлено, но вольер сохранить не удалось. Найдите животное в списке и укажите вольер при редактировании.",
    );
  }
  redirect("/volunteer");
}

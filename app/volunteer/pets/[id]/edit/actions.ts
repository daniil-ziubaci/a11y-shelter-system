"use server";

import { parsePetFields } from "@/lib/parsePetFields";
import { processPhoto } from "@/lib/processPhoto";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { translatePet } from "@/lib/translatePet";

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

  let photoUrl: string | undefined;
  const photo = formData.get("photo");

  if (photo instanceof File && photo.size > 0) {
    const processed = await processPhoto(photo);
    if (!processed) {
      return fail("Не удалось обработать фото. Загрузите JPEG, PNG или WebP.");
    }

    const photoPath = `${membership.shelter_id}/animals/${petId}/${crypto.randomUUID()}.webp`;
    const { error: uploadError } = await supabase.storage
      .from("pet-photos")
      .upload(photoPath, processed, { contentType: "image/webp" });
    if (uploadError) {
      return fail("Не удалось загрузить фото. Попробуйте ещё раз.");
    }

    photoUrl = supabase.storage.from("pet-photos").getPublicUrl(photoPath)
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
  redirect("/volunteer");
}

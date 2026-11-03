"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { translatePet } from "@/lib/translatePet";
import { createClient } from "@/lib/supabase/server";
import { processPhoto } from "@/lib/processPhoto";
import { parsePetFields } from "@/lib/parsePetFields";

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
  } = parsed.fields;

  const photo = formData.get("photo");
  if (!(photo instanceof File) || photo.size === 0) {
    return fail("Выберите фото животного.");
  }
  const processed = await processPhoto(photo);
  if (!processed) {
    return fail("Не удалось обработать фото. Загрузите JPEG, PNG или WebP.");
  }

  const petId = crypto.randomUUID();
  const photoPath = `${membership.shelter_id}/animals/${petId}/photo.webp`;
  const { error: uploadError } = await supabase.storage
    .from("pet-photos")
    .upload(photoPath, processed, { contentType: "image/webp" });
  if (uploadError) {
    return fail("Не удалось загрузить фото. Попробуйте ещё раз.");
  }

  const { data: urlData } = supabase.storage
    .from("pet-photos")
    .getPublicUrl(photoPath);
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
  });
  if (insertError) {
    return fail("Не удалось сохранить животное. Попробуйте ещё раз.");
  }

  after(() => translatePet(petId));
  redirect("/volunteer");
}

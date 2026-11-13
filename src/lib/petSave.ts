import type { AstroGlobal } from "astro";
import { afterResponse, formValues, refreshPublicPages } from "@/lib/panel";
import { parsePetFields } from "@/lib/parsePetFields";
import { PET_STATUS_TREATMENT } from "@/lib/petStatuses";
import { hasFile, uploadPetPhoto } from "@/lib/photos";
import type { Supabase } from "@/lib/supabase";
import { translatePet } from "@/lib/translate";

export type PetSaveResult = { ok: true } | { ok: false; error: string; values: Record<string, string> };

async function saveEnclosure(supabase: Supabase, petId: string, enclosure: string): Promise<boolean> {
  if (enclosure === "") {
    const { error } = await supabase.from("pet_internal").delete().eq("pet_id", petId);
    return !error;
  }
  const { error } = await supabase.from("pet_internal").upsert({ pet_id: petId, enclosure });
  return !error;
}

export async function savePet(astro: AstroGlobal, formData: FormData, existingId: string | null): Promise<PetSaveResult> {
  const values = formValues(formData);
  const fail = (error: string): PetSaveResult => ({ ok: false, error, values });
  const supabase = astro.locals.supabase;

  const parsed = parsePetFields(formData);
  if (!parsed.ok) return fail(parsed.error);
  const fields = parsed.fields;
  const needsTreatment = formData.get("needsTreatment") === "on";
  const treatmentStatus = formData.get("treatmentStatus") === "on";
  const photo = formData.get("photo");

  if (!existingId && !hasFile(photo)) {
    return fail("Выберите фото животного.");
  }

  const petId = existingId ?? crypto.randomUUID();
  let photoUrl: string | undefined;
  if (hasFile(photo)) {
    const basePath = existingId ? `animals/${petId}/${crypto.randomUUID()}` : `animals/${petId}/photo`;
    const uploaded = await uploadPetPhoto(supabase, basePath, formData);
    if (!uploaded.ok) return fail(uploaded.error);
    photoUrl = supabase.storage.from("pet-photos").getPublicUrl(uploaded.path).data.publicUrl;
  }

  const row = {
    name: fields.name,
    species: fields.species,
    sex: fields.sex,
    birth_date: fields.birthDate,
    is_age_approximate: fields.isAgeApproximate,
    size: fields.size,
    health: fields.health,
    description: fields.description,
    photo_alt: fields.photoAlt,
    needs_treatment_since: needsTreatment ? new Date().toISOString() : null,
    ...(treatmentStatus ? { status: PET_STATUS_TREATMENT } : {}),
    ...(photoUrl ? { photo_url: photoUrl } : {}),
  };

  if (existingId) {
    const { data, error } = await supabase.from("pets").update(row).eq("id", petId).select("id").maybeSingle();
    if (error || !data) return fail("Не удалось сохранить животное. Попробуйте ещё раз.");
  } else {
    const { error } = await supabase.from("pets").insert({ ...row, id: petId, photo_url: photoUrl ?? "" });
    if (error) return fail("Не удалось сохранить животное. Попробуйте ещё раз.");
  }

  afterResponse(astro, () => translatePet(supabase, petId));
  refreshPublicPages(astro);

  if ((existingId || fields.enclosure) && !(await saveEnclosure(supabase, petId, fields.enclosure))) {
    return fail(
      existingId
        ? "Животное сохранено, но вольер сохранить не удалось. Попробуйте ещё раз."
        : "Животное добавлено, но вольер сохранить не удалось. Найдите животное в списке и укажите вольер при редактировании.",
    );
  }
  return { ok: true };
}

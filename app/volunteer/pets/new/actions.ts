"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { birthDateFromAge } from "@/lib/birthDateFromAge";
import { processPhoto } from "@/lib/processPhoto";

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

  const text = (field: string) => {
    const value = formData.get(field);
    return typeof value === "string" ? value.trim() : "";
  };

  const name = text("name");
  const species = text("species");
  const sex = text("sex");
  const diet = text("diet");
  const health = text("health");
  const description = text("description");
  const photoAlt = text("photoAlt");

  if (!name || !diet || !health || !description || !photoAlt) {
    return fail("Заполните все обязательные поля.");
  }

  if (!["собака", "кошка"].includes(species)) {
    return fail("Выберите вид животного.");
  }

  if (!["мальчик", "девочка"].includes(sex)) {
    return fail("Выберите пол животного.");
  }

  const weight = Number(text("weight").replace(",", "."));
  if (!Number.isFinite(weight) || weight <= 0 || weight > 100) {
    return fail("Введите вес в килограммах, например 0,8.");
  }

  const birthDateInput = text("birthDate");
  const ageYearsInput = text("ageYears");
  const ageMonthsInput = text("ageMonths");
  let birthDate: string;
  let isAgeApproximate: boolean;

  if (birthDateInput) {
    const today = birthDateFromAge(0, 0);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(birthDateInput) ||
      birthDateInput > today ||
      birthDateInput < "1990-01-01"
    ) {
      return fail("Введите дату рождения, не позже сегодняшнего дня.");
    }
    birthDate = birthDateInput;
    isAgeApproximate = false;
  } else {
    if (!ageYearsInput && !ageMonthsInput) {
      return fail("Укажите дату рождения или примерный возраст.");
    }
    const years = Number(ageYearsInput || "0");
    const months = Number(ageMonthsInput || "0");
    if (
      !Number.isInteger(years) ||
      !Number.isInteger(months) ||
      years < 0 ||
      years > 30 ||
      months < 0 ||
      months > 11
    ) {
      return fail("Возраст: лет от 0 до 30, месяцев от 0 до 11.");
    }
    birthDate = birthDateFromAge(years, months);
    isAgeApproximate = true;
  }

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
    weight,
    diet,
    health,
    description,
    photo_url: urlData.publicUrl,
    photo_alt: photoAlt,
  });
  if (insertError) {
    return fail("Не удалось сохранить животное. Попробуйте ещё раз.");
  }

  redirect("/volunteer");
}

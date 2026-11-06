import { birthDateFromAge } from "@/lib/birthDateFromAge";
import { findContactError } from "@/lib/findContactError";
import { PET_SIZES } from "@/lib/petSizes";

export type PetFields = {
  name: string;
  species: string;
  sex: string;
  health: string;
  description: string;
  photoAlt: string;
  size: string | null;
  enclosure: string;
  birthDate: string;
  isAgeApproximate: boolean;
};

export type ParsePetFieldsResult =
  | { ok: true; fields: PetFields }
  | { ok: false; error: string };

export function parsePetFields(formData: FormData): ParsePetFieldsResult {
  const text = (field: string) => {
    const value = formData.get(field);
    return typeof value === "string" ? value.trim() : "";
  };

  const name = text("name");
  const species = text("species");
  const sex = text("sex");
  const health = text("health");
  const description = text("description");
  const photoAlt = text("photoAlt");
  const enclosure = text("enclosure");

  if (!name || !health || !description || !photoAlt) {
    return { ok: false, error: "Заполните все обязательные поля." };
  }

  if (enclosure.length > 40) {
    return { ok: false, error: "Вольер: не больше 40 знаков." };
  }

  const contactProblem = findContactError([
    ["Имя", name],
    ["Здоровье", health],
    ["Описание", description],
    ["Описание фото", photoAlt],
  ]);
  if (contactProblem) {
    return { ok: false, error: contactProblem };
  }

  if (!["собака", "кошка"].includes(species)) {
    return { ok: false, error: "Выберите вид животного." };
  }

  if (!["мальчик", "девочка"].includes(sex)) {
    return { ok: false, error: "Выберите пол животного." };
  }

  const sizeInput = text("size");
  let size: string | null = null;
  if (species === "собака") {
    if (!PET_SIZES.includes(sizeInput)) {
      return { ok: false, error: "Выберите размер собаки." };
    }
    size = sizeInput;
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
      return {
        ok: false,
        error: "Введите дату рождения, не позже сегодняшнего дня.",
      };
    }
    birthDate = birthDateInput;
    isAgeApproximate = false;
  } else {
    if (!ageYearsInput && !ageMonthsInput) {
      return {
        ok: false,
        error: "Укажите дату рождения или примерный возраст.",
      };
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
      return {
        ok: false,
        error: "Возраст: лет от 0 до 30, месяцев от 0 до 11.",
      };
    }
    birthDate = birthDateFromAge(years, months);
    isAgeApproximate = true;
  }
  return {
    ok: true,
    fields: {
      name,
      species,
      sex,
      health,
      description,
      photoAlt,
      size,
      enclosure,
      birthDate,
      isAgeApproximate,
    },
  };
}

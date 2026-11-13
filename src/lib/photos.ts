import { checkPhoto, type CheckedPhoto } from "@/lib/checkPhoto";
import type { Supabase } from "@/lib/supabase";

type UploadResult = { ok: true; path: string } | { ok: false; error: string };

const NOT_PREPARED = "Фото не подготовилось. Выберите его заново и дождитесь надписи «Выбрано».";
const UPLOAD_FAILED = "Не удалось загрузить фото. Попробуйте ещё раз.";

async function upload(supabase: Supabase, path: string, photo: CheckedPhoto): Promise<boolean> {
  const { error } = await supabase.storage.from("pet-photos").upload(path, photo.bytes, {
    contentType: photo.contentType,
    cacheControl: "31536000",
  });
  return !error;
}

export async function uploadPetPhoto(supabase: Supabase, basePath: string, formData: FormData): Promise<UploadResult> {
  const [full, card, preview] = await Promise.all([
    checkPhoto(formData.get("photo"), { maxSide: 1600 }),
    checkPhoto(formData.get("photoCard"), { maxSide: 800 }),
    checkPhoto(formData.get("photoPreview"), { maxSide: 1200, formats: ["jpeg"] }),
  ]);
  if (!full || !card || !preview || card.format !== full.format) {
    return { ok: false, error: NOT_PREPARED };
  }
  const files: [string, CheckedPhoto][] = [
    [`${basePath}.${full.extension}`, full],
    [`${basePath}-card.${card.extension}`, card],
    [`${basePath}-og.jpg`, preview],
  ];
  for (const [path, photo] of files) {
    if (!(await upload(supabase, path, photo))) {
      return { ok: false, error: UPLOAD_FAILED };
    }
  }
  return { ok: true, path: files[0][0] };
}

export async function uploadProjectPhoto(supabase: Supabase, file: FormDataEntryValue | null): Promise<UploadResult> {
  const photo = await checkPhoto(file, { maxSide: 1600 });
  if (!photo) {
    return { ok: false, error: NOT_PREPARED };
  }
  const path = `projects/${crypto.randomUUID()}.${photo.extension}`;
  return (await upload(supabase, path, photo)) ? { ok: true, path } : { ok: false, error: UPLOAD_FAILED };
}

export function hasFile(value: FormDataEntryValue | null): boolean {
  return value instanceof File && value.size > 0;
}

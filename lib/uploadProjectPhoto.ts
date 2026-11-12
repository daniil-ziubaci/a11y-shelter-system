import { checkPhoto } from "@/lib/checkPhoto";
import { createClient } from "@/lib/supabase/server";

type UploadResult = { ok: true; path: string } | { ok: false; error: string };

export async function uploadProjectPhoto(
  supabase: Awaited<ReturnType<typeof createClient>>,
  shelterId: string,
  file: File,
): Promise<UploadResult> {
  const photo = await checkPhoto(file, { maxSide: 1600 });
  if (!photo) {
    return {
      ok: false,
      error:
        "Фото не подготовилось. Выберите его заново и дождитесь надписи «Выбрано».",
    };
  }

  const path = `${shelterId}/projects/${crypto.randomUUID()}.${photo.extension}`;
  const { error } = await supabase.storage
    .from("pet-photos")
    .upload(path, photo.bytes, {
      contentType: photo.contentType,
      cacheControl: "31536000",
    });
  if (error) {
    return {
      ok: false,
      error: "Не удалось загрузить фото. Попробуйте ещё раз.",
    };
  }

  return { ok: true, path };
}

import { createClient } from "@/lib/supabase/server";
import { processPhoto } from "@/lib/processPhoto";

type UploadResult = { ok: true; path: string } | { ok: false; error: string };

export async function uploadProjectPhoto(
  supabase: Awaited<ReturnType<typeof createClient>>,
  shelterId: string,
  file: File,
): Promise<UploadResult> {
  const processed = await processPhoto(file);
  if (!processed) {
    return {
      ok: false,
      error: "Не удалось обработать фото. Подойдёт JPEG, PNG или WebP.",
    };
  }

  const path = `${shelterId}/projects/${crypto.randomUUID()}.webp`;
  const { error } = await supabase.storage
    .from("pet-photos")
    .upload(path, processed, {
      contentType: "image/webp",
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

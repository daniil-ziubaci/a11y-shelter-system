import { checkPhoto } from "@/lib/checkPhoto";
import { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

type UploadResult = { ok: true; path: string } | { ok: false; error: string };

const NOT_PREPARED =
  "Фото не подготовилось. Выберите его заново и дождитесь надписи «Выбрано».";

// basePath has no extension: it is added from the format the browser produced.
// The card copy and the link preview are stored next to the photo
// (see cardCopyOf and previewCopyOf in lib/photoUrls.ts).
export async function uploadPetPhoto(
  supabase: Supabase,
  basePath: string,
  formData: FormData,
): Promise<UploadResult> {
  const full = await checkPhoto(formData.get("photo"), { maxSide: 1600 });
  const card = await checkPhoto(formData.get("photoCard"), { maxSide: 800 });
  const preview = await checkPhoto(formData.get("photoPreview"), {
    maxSide: 1200,
    formats: ["jpeg"],
  });
  if (!full || !card || !preview || card.format !== full.format) {
    return { ok: false, error: NOT_PREPARED };
  }

  const bucket = supabase.storage.from("pet-photos");
  const files = [
    { path: `${basePath}.${full.extension}`, photo: full },
    { path: `${basePath}-card.${card.extension}`, photo: card },
    { path: `${basePath}-og.jpg`, photo: preview },
  ];
  for (const { path, photo } of files) {
    const { error } = await bucket.upload(path, photo.bytes, {
      contentType: photo.contentType,
      cacheControl: "31536000",
    });
    if (error) {
      return {
        ok: false,
        error: "Не удалось загрузить фото. Попробуйте ещё раз.",
      };
    }
  }
  return { ok: true, path: files[0].path };
}

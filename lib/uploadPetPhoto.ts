import { cardCopyOf } from "@/lib/photoUrls";
import { makeCardCopy } from "@/lib/processPhoto";
import { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

const UPLOAD_OPTIONS = {
  contentType: "image/webp",
  cacheControl: "31536000",
};

export async function uploadPetPhoto(
  supabase: Supabase,
  photoPath: string,
  full: Buffer,
) {
  const card = await makeCardCopy(full).catch(() => null);
  if (!card) {
    return false;
  }
  const bucket = supabase.storage.from("pet-photos");
  const { error: fullError } = await bucket.upload(
    photoPath,
    full,
    UPLOAD_OPTIONS,
  );
  if (fullError) {
    return false;
  }
  const { error: cardError } = await bucket.upload(
    cardCopyOf(photoPath),
    card,
    UPLOAD_OPTIONS,
  );
  return !cardError;
}

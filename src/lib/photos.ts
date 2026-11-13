import type { AstroGlobal } from "astro";
import { checkPhoto, type CheckedPhoto } from "@/lib/checkPhoto";
import { afterResponse } from "@/lib/panel";
import { cardCopyOf, previewCopyOf } from "@/lib/photoUrls";
import { getAdminClient, type Supabase } from "@/lib/supabase";

type UploadResult = { ok: true; path: string } | { ok: false; error: string };

const BUCKET_PATH = "/storage/v1/object/public/pet-photos/";

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

export function storagePathOf(url: string): string | null {
  const index = url.indexOf(BUCKET_PATH);
  return index === -1 ? null : decodeURIComponent(url.slice(index + BUCKET_PATH.length));
}

async function isPhotoInUse(admin: Supabase, path: string): Promise<boolean> {
  const urlPattern = `%${BUCKET_PATH}${path.replace(/[\\%_]/g, "\\$&")}`;
  const counts = await Promise.all([
    admin.from("pets").select("id", { count: "exact", head: true }).like("photo_url", urlPattern),
    admin.from("projects").select("id", { count: "exact", head: true }).eq("photo_path", path),
    admin.from("shelter").select("id", { count: "exact", head: true }).eq("photo_path", path),
  ]);
  return counts.some(({ count, error }) => error !== null || count === null || count > 0);
}

function removeFiles(astro: AstroGlobal, mainPath: string, paths: string[]): void {
  afterResponse(astro, async () => {
    const admin = getAdminClient();
    if (await isPhotoInUse(admin, mainPath)) {
      console.warn("old photo kept: still used or the check failed", mainPath);
      return;
    }
    const { error } = await admin.storage.from("pet-photos").remove(paths);
    if (error) throw error;
  });
}

export function removeReplacedPetPhoto(astro: AstroGlobal, oldUrl: string, newUrl: string): void {
  const path = storagePathOf(oldUrl);
  if (!path || oldUrl === newUrl) return;
  removeFiles(astro, path, [path, cardCopyOf(path), previewCopyOf(path)]);
}

export function removeReplacedProjectPhoto(astro: AstroGlobal, oldPath: string, newPath: string): void {
  if (oldPath === newPath) return;
  removeFiles(astro, oldPath, [oldPath]);
}

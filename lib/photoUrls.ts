const PHOTO_EXTENSION = /\.(webp|jpg)$/;

export function cardCopyOf(pathOrUrl: string) {
  return pathOrUrl.replace(PHOTO_EXTENSION, "-card.$1");
}

export function previewCopyOf(pathOrUrl: string) {
  return pathOrUrl.replace(PHOTO_EXTENSION, "-og.jpg");
}

export function publicPhotoUrl(path: string): string {
  const origin = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin;
  return `${origin}/storage/v1/object/public/pet-photos/${path}`;
}

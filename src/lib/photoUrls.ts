const PHOTO_EXTENSION = /\.(webp|jpg)$/;

export function cardCopyOf(pathOrUrl: string) {
  return pathOrUrl.replace(PHOTO_EXTENSION, "-card.$1");
}

export function previewCopyOf(pathOrUrl: string) {
  return pathOrUrl.replace(PHOTO_EXTENSION, "-og.jpg");
}

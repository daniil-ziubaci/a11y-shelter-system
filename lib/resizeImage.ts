const MAX_SIDE = 1600;
const JPEG_QUALITY = 0.82;

function fitSize(width: number, height: number) {
  const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

async function drawScaled(file: File) {
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });
  const { width, height } = fitSize(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("Canvas is not available");
  }
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return canvas;
}

export async function resizePhoto(file: File): Promise<File> {
  const canvas = await drawScaled(file);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
  );
  if (!blob || blob.size >= file.size) return file;
  const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], name, { type: "image/jpeg" });
}

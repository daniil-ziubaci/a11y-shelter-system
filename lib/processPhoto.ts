import sharp from "sharp";

const ALLOWED_FORMATS = ["jpeg", "png", "webp"];
const MAX_SIDE = 1600;

export async function processPhoto(file: File): Promise<Buffer | null> {
  const input = Buffer.from(await file.arrayBuffer());
  try {
    const { format } = await sharp(input).metadata();
    if (!ALLOWED_FORMATS.includes(format)) {
      return null;
    }
    return await sharp(input)
      .rotate()
      .resize({
        width: MAX_SIDE,
        height: MAX_SIDE,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 80 })
      .toBuffer();
  } catch {
    return null;
  }
}

import sharp from "sharp";

const ALLOWED_FORMATS = ["jpeg", "png", "webp"];
const MAX_SIDE = 1600;
const CARD_SIDE = 800;

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

export async function makeCardCopy(full: Buffer): Promise<Buffer> {
  return sharp(full)
    .resize({
      width: CARD_SIDE,
      height: CARD_SIDE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 75 })
    .toBuffer();
}

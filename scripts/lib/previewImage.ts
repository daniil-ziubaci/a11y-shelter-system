import sharp from "sharp";

const WIDTH = 1200;
const HEIGHT = 630;
const MAX_BYTES = 200_000;
const QUALITIES = [80, 70, 60, 50, 40];

export async function makePreviewJpeg(input: Buffer): Promise<Buffer> {
  const base = sharp(input).rotate().resize(WIDTH, HEIGHT, {
    fit: "cover",
    position: "centre",
  });

  let result = await base
    .clone()
    .jpeg({ quality: QUALITIES[0], mozjpeg: true })
    .toBuffer();
  for (const quality of QUALITIES.slice(1)) {
    if (result.length <= MAX_BYTES) break;
    result = await base.clone().jpeg({ quality, mozjpeg: true }).toBuffer();
  }
  return result;
}

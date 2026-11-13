const FULL_SIDE = 1600;
const CARD_SIDE = 800;
const PREVIEW_WIDTH = 1200;
const PREVIEW_HEIGHT = 630;
const PREVIEW_MAX_BYTES = 200_000;
const PREVIEW_QUALITIES = [0.8, 0.7, 0.6, 0.5, 0.4];

export type PreparedPhotos = {
  full: File;
  card: File | null;
  preview: File | null;
};

function fitInside(width: number, height: number, side: number) {
  const scale = Math.min(1, side / Math.max(width, height));
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

function makeCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is not available");
  }
  return { canvas, context };
}

function drawInside(bitmap: ImageBitmap, side: number) {
  const { width, height } = fitInside(bitmap.width, bitmap.height, side);
  const { canvas, context } = makeCanvas(width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  return canvas;
}

function drawCover(bitmap: ImageBitmap, width: number, height: number) {
  const { canvas, context } = makeCanvas(width, height);
  const scale = Math.max(width / bitmap.width, height / bitmap.height);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  context.drawImage(
    bitmap,
    (bitmap.width - sourceWidth) / 2,
    (bitmap.height - sourceHeight) / 2,
    sourceWidth,
    sourceHeight,
    0,
    0,
    width,
    height,
  );
  return canvas;
}

function toBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Encoding failed"))),
      type,
      quality,
    ),
  );
}
async function encode(
  canvas: HTMLCanvasElement,
  name: string,
  webpQuality: number,
  jpegQuality: number,
): Promise<File> {
  const webp = await toBlob(canvas, "image/webp", webpQuality);
  if (webp.type === "image/webp") {
    return new File([webp], `${name}.webp`, { type: "image/webp" });
  }
  const jpeg = await toBlob(canvas, "image/jpeg", jpegQuality);
  return new File([jpeg], `${name}.jpg`, { type: "image/jpeg" });
}

async function encodePreview(canvas: HTMLCanvasElement): Promise<File> {
  let blob = await toBlob(canvas, "image/jpeg", PREVIEW_QUALITIES[0]);
  for (const quality of PREVIEW_QUALITIES.slice(1)) {
    if (blob.size <= PREVIEW_MAX_BYTES) break;
    blob = await toBlob(canvas, "image/jpeg", quality);
  }
  return new File([blob], "preview.jpg", { type: "image/jpeg" });
}
export async function preparePhotos(
  file: File,
  copies: boolean,
): Promise<PreparedPhotos> {
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });
  try {
    const name = file.name.replace(/\.[^.]+$/, "") || "photo";
    const full = await encode(drawInside(bitmap, FULL_SIDE), name, 0.8, 0.82);
    if (!copies) {
      return { full, card: null, preview: null };
    }
    const card = await encode(
      drawInside(bitmap, CARD_SIDE),
      `${name}-card`,
      0.75,
      0.78,
    );
    const preview = await encodePreview(
      drawCover(bitmap, PREVIEW_WIDTH, PREVIEW_HEIGHT),
    );
    return { full, card, preview };
  } finally {
    bitmap.close();
  }
}

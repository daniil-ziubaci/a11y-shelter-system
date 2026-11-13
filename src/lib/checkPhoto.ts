const MAX_BYTES = 5 * 1024 * 1024;

export type PhotoFormat = "webp" | "jpeg";

export type CheckedPhoto = {
  bytes: Uint8Array;
  format: PhotoFormat;
  contentType: "image/webp" | "image/jpeg";
  extension: "webp" | "jpg";
  width: number;
  height: number;
};

type Header = {
  format: PhotoFormat;
  width: number;
  height: number;
  hasMetadata: boolean;
};

function ascii(bytes: Uint8Array, start: number, length: number): string {
  return String.fromCharCode(...bytes.subarray(start, start + length));
}

function readWebp(bytes: Uint8Array): Header | null {
  if (
    bytes.length < 30 ||
    ascii(bytes, 0, 4) !== "RIFF" ||
    ascii(bytes, 8, 4) !== "WEBP"
  ) {
    return null;
  }
  const chunk = ascii(bytes, 12, 4);
  if (chunk === "VP8 ") {
    if (bytes[23] !== 0x9d || bytes[24] !== 0x01 || bytes[25] !== 0x2a) {
      return null;
    }
    return {
      format: "webp",
      width: (bytes[26] | (bytes[27] << 8)) & 0x3fff,
      height: (bytes[28] | (bytes[29] << 8)) & 0x3fff,
      hasMetadata: false,
    };
  }
  if (chunk === "VP8L") {
    if (bytes[20] !== 0x2f) {
      return null;
    }
    return {
      format: "webp",
      width: 1 + (((bytes[22] & 0x3f) << 8) | bytes[21]),
      height:
        1 +
        (((bytes[24] & 0x0f) << 10) |
          (bytes[23] << 2) |
          ((bytes[22] & 0xc0) >> 6)),
      hasMetadata: false,
    };
  }
  if (chunk === "VP8X") {
    const flags = bytes[20];
    const animated = (flags & 0x02) !== 0;
    if (animated) {
      return null;
    }
    return {
      format: "webp",
      width: 1 + (bytes[24] | (bytes[25] << 8) | (bytes[26] << 16)),
      height: 1 + (bytes[27] | (bytes[28] << 8) | (bytes[29] << 16)),
      hasMetadata: (flags & 0x0c) !== 0,
    };
  }
  return null;
}

const JPEG_FRAME_MARKERS = new Set([
  0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
]);

function readJpeg(bytes: Uint8Array): Header | null {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return null;
  }
  let hasMetadata = false;
  let offset = 2;
  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) {
      return null;
    }
    const marker = bytes[offset + 1];
    if (marker === 0xff) {
      offset += 1;
      continue;
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }
    if (marker === 0xd9 || marker === 0xda) {
      return null;
    }
    const length = (bytes[offset + 2] << 8) | bytes[offset + 3];
    if (length < 2) {
      return null;
    }
    if (marker === 0xe1) {
      const label = ascii(bytes, offset + 4, Math.min(length - 2, 29));
      if (
        label.startsWith("Exif") ||
        label.startsWith("http://ns.adobe.com/xap/1.0/")
      ) {
        hasMetadata = true;
      }
    }
    if (JPEG_FRAME_MARKERS.has(marker)) {
      if (offset + 9 > bytes.length) {
        return null;
      }
      return {
        format: "jpeg",
        height: (bytes[offset + 5] << 8) | bytes[offset + 6],
        width: (bytes[offset + 7] << 8) | bytes[offset + 8],
        hasMetadata,
      };
    }
    offset += 2 + length;
  }
  return null;
}

export function readPhotoHeader(bytes: Uint8Array): Header | null {
  return readWebp(bytes) ?? readJpeg(bytes);
}

export async function checkPhoto(
  value: FormDataEntryValue | null,
  limits: { maxSide: number; formats?: PhotoFormat[] },
): Promise<CheckedPhoto | null> {
  if (!(value instanceof File) || value.size === 0 || value.size > MAX_BYTES) {
    return null;
  }
  const bytes = new Uint8Array(await value.arrayBuffer());
  const header = readPhotoHeader(bytes);
  if (
    !header ||
    header.hasMetadata ||
    header.width === 0 ||
    header.height === 0 ||
    Math.max(header.width, header.height) > limits.maxSide ||
    !(limits.formats ?? ["webp", "jpeg"]).includes(header.format)
  ) {
    return null;
  }
  const webp = header.format === "webp";
  return {
    bytes,
    format: header.format,
    contentType: webp ? "image/webp" : "image/jpeg",
    extension: webp ? "webp" : "jpg",
    width: header.width,
    height: header.height,
  };
}

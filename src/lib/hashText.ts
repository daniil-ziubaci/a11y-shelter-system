import { createHash } from "node:crypto";

function hashText(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
}

export function textHash(key: string, text: string): string {
  return hashText(`${key}\u0000${text}`);
}

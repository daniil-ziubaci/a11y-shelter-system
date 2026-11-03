import "server-only";

const DEEPL_URL = "https://api-free.deepl.com/v2";
const STOP_SHARE = 0.95;

const RETRY_STATUSES = [429, 500, 503, 504, 529];

function pause(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function getRemainingCharacters(): Promise<number> {
  const key = process.env.DEEPL_API_KEY;
  if (!key) {
    return 0;
  }
  try {
    const response = await fetch(`${DEEPL_URL}/usage`, {
      headers: { Authorization: `DeepL-Auth-Key ${key}` },
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    if (!response.ok) {
      return 0;
    }
    const usage: { character_count: number; character_limit: number } =
      await response.json();
    return Math.max(
      0,
      Math.floor(usage.character_limit * STOP_SHARE) - usage.character_count,
    );
  } catch {
    return 0;
  }
}

function targetCode(locale: string): string {
  return locale === "en" ? "EN-US" : locale.toUpperCase();
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function unescapeXml(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

export type NamePair = { from: string; to: string };

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function prepare(text: string, name?: NamePair): string {
  const escaped = escapeXml(text);
  if (!name || name.from === "") {
    return escaped;
  }
  const pattern = new RegExp(
    `(?<![\\p{L}\\d])${escapeRegExp(escapeXml(name.from))}(?![\\p{L}\\d])`,
    "giu",
  );
  return escaped.replace(pattern, () => `<x>${escapeXml(name.to)}</x>`);
}

export async function translateTexts(
  texts: string[],
  from: string,
  to: string,
  name?: NamePair,
): Promise<string[] | null> {
  const key = process.env.DEEPL_API_KEY;
  if (!key || texts.length === 0) {
    return null;
  }
  const body = JSON.stringify({
    text: texts.map((text) => prepare(text, name)),
    source_lang: from.toUpperCase(),
    target_lang: targetCode(to),
    tag_handling: "xml",
    ignore_tags: ["x"],
  });
  for (let attempt = 0; attempt < 2; attempt += 1) {
    let delay = 1000;
    try {
      const response = await fetch(`${DEEPL_URL}/translate`, {
        method: "POST",
        headers: {
          Authorization: `DeepL-Auth-Key ${key}`,
          "Content-Type": "application/json",
        },
        body,
        signal: AbortSignal.timeout(15000),
        cache: "no-store",
      });
      if (response.ok) {
        const data: { translations: { text: string }[] } =
          await response.json();
        if (data.translations.length !== texts.length) {
          return null;
        }
        return data.translations.map((item) =>
          unescapeXml(item.text.replace(/<\/?x>/g, "")),
        );
      }
      if (!RETRY_STATUSES.includes(response.status)) {
        return null;
      }
      const retryAfter = Number(response.headers.get("Retry-After"));
      if (retryAfter > 0) {
        delay = Math.min(retryAfter, 5) * 1000;
      }
    } catch {
      return null;
    }
    await pause(delay);
  }
  return null;
}

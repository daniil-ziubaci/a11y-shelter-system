import { DEEPL_API_KEY } from "astro:env/server";

const DEEPL_URL = "https://api-free.deepl.com/v2";
const STOP_SHARE = 0.95;

const RETRY_STATUSES = [429, 500, 503, 504, 529];

function pause(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export type DeeplStatus =
  | { ok: true; remaining: number }
  | { ok: false; reason: string };

export async function getDeeplStatus(): Promise<DeeplStatus> {
  const key = DEEPL_API_KEY;
  if (!key) {
    return { ok: false, reason: "DEEPL_API_KEY не задан" };
  }
  try {
    const response = await fetch(`${DEEPL_URL}/usage`, {
      headers: { Authorization: `DeepL-Auth-Key ${key}` },
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    if (!response.ok) {
      const hint =
        response.status === 403 && !key.trim().endsWith(":fx")
          ? " (ключ не похож на ключ DeepL API Free: он должен заканчиваться на :fx)"
          : response.status === 403
            ? " (DeepL не принял ключ)"
            : "";
      const reason = `DeepL ответил ${response.status} на проверку лимита${hint}`;
      console.error(reason, (await response.text()).slice(0, 200));
      return { ok: false, reason };
    }
    const usage: { character_count: number; character_limit: number } =
      await response.json();
    const remaining = Math.max(
      0,
      Math.floor(usage.character_limit * STOP_SHARE) - usage.character_count,
    );
    if (remaining === 0) {
      const reason = `лимит DeepL на этот месяц израсходован: ${usage.character_count} из ${usage.character_limit} символов (перевод останавливается на 95%)`;
      console.error(reason);
      return { ok: false, reason };
    }
    return { ok: true, remaining };
  } catch (error) {
    const reason = `DeepL недоступен: ${error instanceof Error ? error.message : String(error)}`;
    console.error(reason);
    return { ok: false, reason };
  }
}

export async function getRemainingCharacters(): Promise<number> {
  const status = await getDeeplStatus();
  return status.ok ? status.remaining : 0;
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
  context?: string,
): Promise<string[] | null> {
  const key = DEEPL_API_KEY;
  if (!key || texts.length === 0) {
    return null;
  }
  const body = JSON.stringify({
    text: texts.map((text) => prepare(text, name)),
    source_lang: from.toUpperCase(),
    target_lang: targetCode(to),
    tag_handling: "xml",
    ignore_tags: ["x"],
    ...(context ? { context } : {}),
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
          console.error(
            `DeepL translate ${from}->${to}: ${data.translations.length} translations for ${texts.length} texts`,
          );
          return null;
        }
        return data.translations.map((item) =>
          unescapeXml(item.text.replace(/<\/?x>/g, "")),
        );
      }
      if (!RETRY_STATUSES.includes(response.status)) {
        console.error(
          `DeepL translate ${from}->${to} failed: ${response.status}`,
          (await response.text()).slice(0, 200),
        );
        return null;
      }
      const retryAfter = Number(response.headers.get("Retry-After"));
      if (retryAfter > 0) {
        delay = Math.min(retryAfter, 5) * 1000;
      }
    } catch (error) {
      console.error(
        `DeepL translate ${from}->${to} failed:`,
        error instanceof Error ? error.message : error,
      );
      return null;
    }
    await pause(delay);
  }
  console.error(`DeepL translate ${from}->${to}: still busy after a retry`);
  return null;
}

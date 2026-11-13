import en from "@/messages/en.json";
import ro from "@/messages/ro.json";
import ru from "@/messages/ru.json";

export const LOCALES = ["ru", "ro", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ru";

type Messages = typeof ru;
export type Namespace = keyof Messages;
type Values = Record<string, string | number>;

const MESSAGES: Record<Locale, Messages> = { ru, ro, en };

export function isLocale(value: string | undefined): value is Locale {
  return LOCALES.some((locale) => locale === value);
}

export function toLocale(value: string | undefined): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

function lookup(locale: Locale, namespace: Namespace, key: string): string {
  let node: unknown = MESSAGES[locale][namespace];
  for (const part of key.split(".")) {
    node = (node as Record<string, unknown> | undefined)?.[part];
  }
  if (typeof node !== "string") {
    throw new Error(`Missing message ${locale}.${namespace}.${key}`);
  }
  return node;
}

function closingBrace(text: string, open: number): number {
  let depth = 0;
  for (let i = open; i < text.length; i += 1) {
    if (text[i] === "{") depth += 1;
    if (text[i] === "}") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  throw new Error(`Unbalanced message: ${text}`);
}

function readBranches(text: string): Map<string, string> {
  const branches = new Map<string, string>();
  let i = 0;
  while (i < text.length) {
    const open = text.indexOf("{", i);
    if (open === -1) break;
    const selector = text.slice(i, open).trim();
    const close = closingBrace(text, open);
    branches.set(selector, text.slice(open + 1, close));
    i = close + 1;
  }
  return branches;
}

function format(locale: Locale, text: string, values: Values, count?: string): string {
  let result = "";
  let i = 0;
  while (i < text.length) {
    const char = text[i];
    if (char === "#" && count !== undefined) {
      result += count;
      i += 1;
      continue;
    }
    if (char !== "{") {
      result += char;
      i += 1;
      continue;
    }
    const close = closingBrace(text, i);
    const body = text.slice(i + 1, close);
    const [name, kind, ...rest] = body.split(",");
    const key = name.trim();
    const value = values[key];
    if (kind === undefined) {
      result += value === undefined ? "" : String(value);
    } else {
      const branches = readBranches(rest.join(","));
      if (kind.trim() === "plural") {
        const number = Number(value);
        const branch =
          branches.get(`=${number}`) ??
          branches.get(new Intl.PluralRules(locale).select(number)) ??
          branches.get("other") ??
          "";
        result += format(locale, branch, values, new Intl.NumberFormat(locale).format(number));
      } else {
        const branch = branches.get(String(value)) ?? branches.get("other") ?? "";
        result += format(locale, branch, values, count);
      }
    }
    i = close + 1;
  }
  return result;
}

export type Translate = (key: string, values?: Values) => string;

export function getTranslator(locale: Locale, namespace: Namespace): Translate {
  return (key, values = {}) => format(locale, lookup(locale, namespace, key), values);
}

export type RichPart = { text: string; tag?: string };

export function richParts(text: string): RichPart[] {
  const parts: RichPart[] = [];
  const pattern = /<([a-z]+)>(.*?)<\/\1>/g;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > last) parts.push({ text: text.slice(last, match.index) });
    parts.push({ tag: match[1], text: match[2] });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}

export function formatNumber(locale: Locale, value: number): string {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatLongDate(locale: Locale, value: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" }).format(new Date(value));
}

import { IntlMessageFormat } from "intl-messageformat";
import ru from "@/messages/ru.json";
import ro from "@/messages/ro.json";
import en from "@/messages/en.json";

export const LOCALES = ["ru", "ro", "en"] as const;
export type Locale = (typeof LOCALES)[number];
const all: Record<string, Record<string, unknown>> = { ru, ro, en };
const compiled = new Map<string, IntlMessageFormat>();

export type Values = Record<string, string | number | ((chunks: string) => string)>;

export function getT(locale: string, namespace: string) {
  return (key: string, values?: Values): string => {
    const id = `${locale}:${namespace}.${key}`;
    let format = compiled.get(id);
    if (!format) {
      let node: unknown = all[locale][namespace];
      for (const part of key.split(".")) node = (node as Record<string, unknown>)?.[part];
      if (typeof node !== "string") return `${namespace}.${key}`;
      format = new IntlMessageFormat(node, locale);
      compiled.set(id, format);
    }
    const out = format.format(values as never);
    return Array.isArray(out) ? out.join("") : String(out);
  };
}

export function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const HANDLE = /(?:^|\s)@[\p{L}\d_]{3,}/u;
const LINK =
  /https?:\/\/|www\.|[\p{L}\d-]+\.(?:com|md|ru|ro|org|net|info|me|io|ua|eu|by|su|online|site)\b/iu;

const DATE = /\b(?:\d{1,2}[./-]\d{1,2}[./-]\d{4}|\d{4}-\d{2}-\d{2})\b/g;
const PHONE_CANDIDATE = /\+?\d[\d\s().-]{6,}\d/g;
const MIN_PHONE_DIGITS = 8;
const MAX_PHONE_DIGITS = 13;

function findPhone(text: string): string | null {
  const withoutDates = text.replace(DATE, " ");
  const candidates = withoutDates.match(PHONE_CANDIDATE) ?? [];

  const phone = candidates.find((candidate) => {
    const digits = candidate.replace(/\D/g, "").length;
    return digits >= MIN_PHONE_DIGITS && digits <= MAX_PHONE_DIGITS;
  });

  return phone ?? null;
}

export type ContactKind = "phone" | "email" | "link" | "handle";

export type FoundContact = { kind: ContactKind; match: string };

function findWord(text: string, pattern: RegExp): string | undefined {
  return text.split(/\s+/).find((word) => pattern.test(word));
}

export function findContact(text: string): FoundContact | null {
  const email = findWord(text, EMAIL);
  if (email) return { kind: "email", match: email };

  const link = findWord(text, LINK);
  if (link) return { kind: "link", match: link };

  const handle = findWord(text, HANDLE);
  if (handle) return { kind: "handle", match: handle };

  const phone = findPhone(text);
  if (phone) return { kind: "phone", match: phone };

  return null;
}

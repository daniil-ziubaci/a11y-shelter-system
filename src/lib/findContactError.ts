import { findContact, type ContactKind } from "@/lib/findContact";

const CONTACT_KIND_WORDS: Record<ContactKind, string> = {
  phone: "телефон",
  email: "почту",
  link: "ссылку",
  handle: "@ник",
};

export function findContactError(fields: [string, string][]): string | null {
  for (const [label, text] of fields) {
    const found = findContact(text);
    if (found) {
      return `Уберите из поля «${label}» ${CONTACT_KIND_WORDS[found.kind]}: ${found.match}. Контакты приюта показываются только внизу страницы, поэтому текст с ними сохранить нельзя. Введённый текст остался в форме.`;
    }
  }
  return null;
}

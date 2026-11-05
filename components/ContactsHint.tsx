import { hintClass } from "@/lib/formClasses";

export function ContactsHint({ id }: { id: string }) {
  return (
    <p id={id} className={hintClass}>
      Не пишите в текстах телефоны, почты, ссылки, адреса и фамилии людей. Если
      они есть, текст не сохранится: удалите их, и всё остальное останется.
    </p>
  );
}

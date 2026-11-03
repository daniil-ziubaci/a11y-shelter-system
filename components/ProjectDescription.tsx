import type { ContentLanguage } from "@/lib/contentLanguage";
import { parseDescription } from "@/lib/parseDescription";

export function ProjectDescription({
  text,
  language,
}: {
  text: string;
  language: ContentLanguage;
}) {
  return (
    <div lang={language} className="flex flex-col gap-3">
      {parseDescription(text).map((block, index) =>
        block.type === "list" ? (
          <ul key={index} className="list-disc pl-6">
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex}>{item}</li>
            ))}
          </ul>
        ) : (
          <p key={index} className="whitespace-pre-line">
            {block.lines.join("\n")}
          </p>
        ),
      )}
    </div>
  );
}

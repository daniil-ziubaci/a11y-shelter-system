export type DescriptionBlock =
  | { type: "paragraph"; lines: string[] }
  | { type: "list"; items: string[] };

export function parseDescription(text: string): DescriptionBlock[] {
  const blocks: DescriptionBlock[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];

  const flush = () => {
    if (paragraph.length > 0) {
      blocks.push({ type: "paragraph", lines: paragraph });
      paragraph = [];
    }
    if (list.length > 0) {
      blocks.push({ type: "list", items: list });
      list = [];
    }
  };

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === "") {
      flush();
    } else if (line.startsWith("- ")) {
      if (paragraph.length > 0) {
        flush();
      }
      list.push(line.slice(2).trim());
    } else {
      if (list.length > 0) {
        flush();
      }
      paragraph.push(line);
    }
  }
  flush();
  return blocks;
}

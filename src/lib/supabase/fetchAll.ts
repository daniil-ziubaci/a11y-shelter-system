type Page<T> = PromiseLike<{ data: T[] | null; error: unknown }>;

export async function fetchAll<T>(
  load: (from: number, to: number) => Page<T>,
  size = 1000,
): Promise<T[]> {
  const rows: T[] = [];
  for (;;) {
    const { data, error } = await load(rows.length, rows.length + size - 1);
    if (error || !data) {
      throw new Error("Не удалось загрузить данные.");
    }
    if (data.length === 0) {
      return rows;
    }
    rows.push(...data);
  }
}

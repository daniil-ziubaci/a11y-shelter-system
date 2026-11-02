export function parsePage(value: string | undefined): number {
  const page = Number(value);
  if (!Number.isInteger(page) || page < 1) {
    return 1;
  }
  return page;
}

export const CATALOG_PAGE_SIZE = 24;
export const NEEDS_PAGE_SIZE = 24;
export function parseShown(value: string | undefined): number {
  const shown = Number(value);
  if (!Number.isInteger(shown) || shown < NEEDS_PAGE_SIZE) {
    return NEEDS_PAGE_SIZE;
  }
  return Math.min(Math.ceil(shown / NEEDS_PAGE_SIZE), 40) * NEEDS_PAGE_SIZE;
}

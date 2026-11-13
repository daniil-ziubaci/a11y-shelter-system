export const GALLERY_WIDTHS = [480, 800] as const;

export const GALLERY_SIZES = "(min-width: 1056px) 1024px, calc(100vw - 2rem)";

export function galleryCopyOf(src: string, width: number): string {
  return src.replace(/\.webp$/, `-${width}.webp`);
}

export function gallerySrcset(src: string): string {
  return [...GALLERY_WIDTHS.map((width) => `${galleryCopyOf(src, width)} ${width}w`), `${src} 1200w`].join(", ");
}

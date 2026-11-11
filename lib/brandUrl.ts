export function brandUrl(brandPath: string, file: string): string {
  const origin = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin;
  return `${origin}/storage/v1/object/public/pet-photos/${brandPath}/${file}`;
}

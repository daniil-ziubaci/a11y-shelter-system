import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database";

export function connect(usage: string) {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY не заданы (файл .env.coordinator).");
    console.error(`Использование: node --env-file=.env.coordinator scripts/${usage}`);
    process.exit(1);
  }
  return createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function splitArgs(argv: string[]) {
  const apply = argv.includes("--apply");
  return { apply, args: argv.filter((arg) => arg !== "--apply") };
}

export function stopUnlessApply(apply: boolean): void {
  if (!apply) {
    console.log("Ничего не изменено. Чтобы применить, добавьте --apply.");
    process.exit(0);
  }
}

export const STORAGE_MARKER = "/storage/v1/object/public/pet-photos/";

export function storagePath(url: string | null): string | null {
  const index = url?.indexOf(STORAGE_MARKER) ?? -1;
  return url && index !== -1 ? decodeURIComponent(url.slice(index + STORAGE_MARKER.length)) : null;
}

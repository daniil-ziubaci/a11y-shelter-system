import { createClient } from "@supabase/supabase-js";

const [slug, name, city] = process.argv.slice(2);

if (!slug || !name || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
  console.error(
    'Использование: node --env-file=.env.coordinator scripts/create-shelter.ts slug "Название" ["Город"]',
  );
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const { data: existing, error: findError } = await supabase
  .from("shelters")
  .select("id")
  .eq("slug", slug)
  .maybeSingle();

if (findError) {
  console.error(findError.message);
  process.exit(1);
}

if (existing) {
  console.log(`Приют ${slug} уже есть: ${existing.id}`);
  process.exit(0);
}

const { data, error } = await supabase
  .from("shelters")
  .insert({ slug, name, city: city ?? null })
  .select("id")
  .single();

if (error) {
  console.error(error.message);
  process.exit(1);
}

console.log(`Создан приют ${slug}: ${data.id}`);

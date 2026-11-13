import { connect, splitArgs, stopUnlessApply } from "./lib/connect.ts";

const { apply, args } = splitArgs(process.argv.slice(2));
const [name, city] = args;
const usage = 'create-shelter.ts "Название" ["Город"] [--apply]';
if (!name) {
  console.error(`Использование: node --env-file=.env.coordinator scripts/${usage}`);
  process.exit(1);
}
const supabase = connect(usage);

const { data: existing, error } = await supabase.from("shelter").select("name").maybeSingle();
if (error) {
  console.error(error.message);
  process.exit(1);
}
if (existing) {
  console.log(`Приют уже заведён: «${existing.name}». На сайте может быть только один приют.`);
  process.exit(0);
}

console.log(`Будет заведён приют «${name}»${city ? `, город ${city}` : ""}. Он скрыт от посетителей, пока is_published = false.`);
stopUnlessApply(apply);

const { error: insertError } = await supabase.from("shelter").insert({ name, city: city ?? null });
if (insertError) {
  console.error(insertError.message);
  process.exit(1);
}
console.log("Приют заведён.");

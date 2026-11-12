import type { Database } from "@/types/database";
import { createClient } from "@supabase/supabase-js";

// Moves a volunteer from one shelter to another. The volunteer panel works
// with ONE shelter per account (it reads the first membership it finds), so
// the membership is moved, not added. The account, its password and its
// second factor stay as they are; the panel shows the new shelter on the
// next page load.
//
// Without --apply it only shows what would change.
//
//   node --env-file=.env.coordinator scripts/move-volunteer.ts почта test-shelter live-life
//   node --env-file=.env.coordinator scripts/move-volunteer.ts почта test-shelter live-life --apply

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const args = process.argv.slice(2);
const apply = args.includes("--apply");
const [email, fromSlug, toSlug] = args.filter((arg) => arg !== "--apply");

if (
  !url ||
  !serviceKey ||
  !email ||
  !fromSlug ||
  !toSlug ||
  fromSlug === toSlug
) {
  console.error(
    "Использование: node --env-file=.env.coordinator scripts/move-volunteer.ts почта откуда куда [--apply]",
  );
  process.exit(1);
}

const supabase = createClient<Database>(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function shelterBySlug(slug: string) {
  const { data, error } = await supabase
    .from("shelters")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) {
    console.error(
      `Приют «${slug}» не найден${error ? `: ${error.message}` : "."}`,
    );
    process.exit(1);
  }
  return data;
}

async function userByEmail(address: string) {
  const wanted = address.trim().toLowerCase();
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) {
      console.error(`Не удалось прочитать пользователей: ${error.message}`);
      process.exit(1);
    }
    const found = data.users.find(
      (user) => user.email?.toLowerCase() === wanted,
    );
    if (found) return found;
    if (data.users.length < 1000) return null;
  }
}

const from = await shelterBySlug(fromSlug);
const to = await shelterBySlug(toSlug);
const user = await userByEmail(email);
if (!user) {
  console.error(`Пользователя с почтой ${email} нет.`);
  process.exit(1);
}

const { data: memberships, error: membershipsError } = await supabase
  .from("shelter_members")
  .select("shelter_id, shelters(name)")
  .eq("user_id", user.id);
if (membershipsError || !memberships) {
  console.error(
    membershipsError?.message ?? "Не удалось прочитать привязки к приютам.",
  );
  process.exit(1);
}

const inFrom = memberships.some((m) => m.shelter_id === from.id);
const inTo = memberships.some((m) => m.shelter_id === to.id);
const others = memberships.filter(
  (m) => m.shelter_id !== from.id && m.shelter_id !== to.id,
);

console.log(`Волонтёр ${email}:`);
console.log(
  `  сейчас: ${memberships.length ? memberships.map((m) => `«${m.shelters?.name ?? m.shelter_id}»`).join(", ") : "ни в одном приюте"}`,
);
if (!inFrom) {
  console.log(
    inTo
      ? `  уже в «${to.name}» и не в «${from.name}»: менять нечего.`
      : `  не состоит в «${from.name}»: переносить нечего.`,
  );
  process.exit(inTo ? 0 : 1);
}
console.log(
  `  станет: «${to.name}»${others.length ? ` (и ещё ${others.length})` : ""}`,
);
if (others.length) {
  console.log(
    "  Внимание: у волонтёра есть и другие приюты; панель покажет любой из них. Лучше оставить один.",
  );
}

if (!apply) {
  console.log("Ничего не изменено. Чтобы перенести, добавьте --apply.");
  process.exit(0);
}

// Already in the target too: only the old membership has to go.
const { error } = inTo
  ? await supabase
      .from("shelter_members")
      .delete()
      .eq("user_id", user.id)
      .eq("shelter_id", from.id)
  : await supabase
      .from("shelter_members")
      .update({ shelter_id: to.id })
      .eq("user_id", user.id)
      .eq("shelter_id", from.id);
if (error) {
  console.error(`Не перенесено: ${error.message}`);
  process.exit(1);
}
console.log(
  `Перенесено. Обновите страницу панели: в шапке будет «${to.name}».`,
);

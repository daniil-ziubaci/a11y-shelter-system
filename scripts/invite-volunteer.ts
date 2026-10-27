import type { Database } from "@/types/database";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const siteUrl = process.env.SITE_URL;
const [email, slug] = process.argv.slice(2);

if (!url || !serviceKey || !siteUrl || !email || !slug) {
  console.error(
    "Использование: node --env-file=.env.coordinator scripts/invite-volunteer.ts почта slug",
  );
  process.exit(1);
}

const supabase = createClient<Database>(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: shelter, error: shelterError } = await supabase
  .from("shelters")
  .select("id")
  .eq("slug", slug)
  .maybeSingle();

if (shelterError) {
  console.error(shelterError.message);
  process.exit(1);
}

if (!shelter) {
  console.error("Приют с таким slug не найден.");
  process.exit(1);
}

const { data: invite, error: inviteError } =
  await supabase.auth.admin.generateLink({ type: "invite", email });

if (inviteError || !invite.user || !invite.properties) {
  console.error(inviteError?.message ?? "Не удалось создать приглашение.");
  process.exit(1);
}

const { error: memberError } = await supabase.from("shelter_members").insert({
  shelter_id: shelter.id,
  user_id: invite.user.id,
});

if (memberError) {
  console.error(
    `Пользователь создан, но в приют не добавлен: ${memberError.message}`,
  );
  process.exit(1);
}

const link = new URL("/auth/confirm", siteUrl);
link.searchParams.set("token_hash", invite.properties.hashed_token);
link.searchParams.set("type", "invite");

console.log("Одноразовая ссылка для волонтёра:");
console.log(link.toString());

import { connect, splitArgs, stopUnlessApply } from "./lib/connect.ts";

const { apply, args } = splitArgs(process.argv.slice(2));
const [email] = args;
const usage = "invite-volunteer.ts почта [--apply]";
const siteUrl = process.env.SITE_URL;
if (!email || !siteUrl) {
  console.error(`Использование: node --env-file=.env.coordinator scripts/${usage} (нужен SITE_URL)`);
  process.exit(1);
}
const supabase = connect(usage);

console.log(`Будет создан вход для ${email} и одноразовая ссылка-приглашение на ${siteUrl}.`);
stopUnlessApply(apply);

const { data: invite, error: inviteError } = await supabase.auth.admin.generateLink({ type: "invite", email });
if (inviteError || !invite.user || !invite.properties) {
  console.error(inviteError?.message ?? "Не удалось создать приглашение.");
  process.exit(1);
}

const { error: volunteerError } = await supabase.from("volunteers").insert({ user_id: invite.user.id });
if (volunteerError) {
  console.error(`Пользователь создан, но в волонтёры не добавлен: ${volunteerError.message}`);
  process.exit(1);
}

const link = new URL("/auth/confirm", siteUrl);
link.searchParams.set("token_hash", invite.properties.hashed_token);
link.searchParams.set("type", "invite");
console.log("Одноразовая ссылка для волонтёра:");
console.log(link.toString());

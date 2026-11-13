import { connect, splitArgs, stopUnlessApply } from "./lib/connect.ts";

const { apply, args } = splitArgs(process.argv.slice(2));
const [email] = args;
const usage = "reset-password.ts почта [--apply]";
const siteUrl = process.env.SITE_URL;
if (!email || !siteUrl) {
  console.error(`Использование: node --env-file=.env.coordinator scripts/${usage} (нужен SITE_URL)`);
  process.exit(1);
}
const supabase = connect(usage);

const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
if (usersError) {
  console.error(usersError.message);
  process.exit(1);
}
const user = usersData.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
if (!user) {
  console.error("Пользователь с такой почтой не найден среди первых 1000.");
  process.exit(1);
}
const { data: volunteer, error: volunteerError } = await supabase.from("volunteers").select("user_id").eq("user_id", user.id).maybeSingle();
if (volunteerError) {
  console.error(volunteerError.message);
  process.exit(1);
}
if (!volunteer) {
  console.error("Этот пользователь не волонтёр приюта. Ссылка не создана.");
  process.exit(1);
}

console.log(`Будет создана одноразовая ссылка для нового пароля ${email} на ${siteUrl}. Старый пароль перестанет работать, когда человек задаст новый.`);
stopUnlessApply(apply);

const { data: recovery, error: recoveryError } = await supabase.auth.admin.generateLink({ type: "recovery", email: user.email ?? email });
if (recoveryError || !recovery.properties) {
  console.error(recoveryError?.message ?? "Не удалось создать ссылку.");
  process.exit(1);
}
const link = new URL("/auth/confirm", siteUrl);
link.searchParams.set("token_hash", recovery.properties.hashed_token);
link.searchParams.set("type", "recovery");
console.log("Одноразовая ссылка для волонтёра (передайте лично):");
console.log(link.toString());

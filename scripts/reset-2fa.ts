import { connect, splitArgs, stopUnlessApply } from "./lib/connect.ts";

const { apply, args } = splitArgs(process.argv.slice(2));
const [email] = args;
const usage = "reset-2fa.ts почта [--apply]";
if (!email) {
  console.error(`Использование: node --env-file=.env.coordinator scripts/${usage}`);
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
  console.error("Этот пользователь не волонтёр приюта. Сброс отменён.");
  process.exit(1);
}

const { data: factorsData, error: factorsError } = await supabase.auth.admin.mfa.listFactors({ userId: user.id });
if (factorsError) {
  console.error(factorsError.message);
  process.exit(1);
}
console.log(`Будет удалено факторов входа у ${email}: ${factorsData.factors.length}.`);
stopUnlessApply(apply);

for (const factor of factorsData.factors) {
  const { error } = await supabase.auth.admin.mfa.deleteFactor({ id: factor.id, userId: user.id });
  if (error) {
    console.error(`Не удалось удалить фактор ${factor.id}: ${error.message}`);
    process.exit(1);
  }
}
console.log(`Удалено факторов: ${factorsData.factors.length}`);
console.log("Попросите человека сразу войти и заново настроить приложение.");

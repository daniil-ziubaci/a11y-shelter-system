import { connect, splitArgs, stopUnlessApply } from "./lib/connect.ts";

const { apply, args } = splitArgs(process.argv.slice(2));
const [email] = args;
const usage = "remove-volunteer.ts почта [--apply]";
if (!email) {
  console.error("Не указана почта волонтёра.");
  console.error(`Использование: node --env-file=.env.coordinator scripts/${usage}`);
  process.exit(1);
}
const supabase = connect(usage);

async function findUser(address: string) {
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) {
    console.error(error.message);
    process.exit(1);
  }
  return data.users.find((u) => u.email?.toLowerCase() === address.toLowerCase()) ?? null;
}

const user = await findUser(email);
if (!user) {
  console.error(`Нет пользователя с почтой ${email} (среди первых 1000). Проверьте написание почты. Ничего не изменено.`);
  process.exit(1);
}

const { data: volunteer, error: volunteerError } = await supabase.from("volunteers").select("user_id").eq("user_id", user.id).maybeSingle();
if (volunteerError) {
  console.error(volunteerError.message);
  process.exit(1);
}
if (!volunteer) {
  console.error(`${email} не волонтёр приюта. Удаление отменено, ничего не изменено.`);
  process.exit(1);
}

console.log(`Будет удалён вход ${email}: пароль, второй фактор и сессии. Запись в списке волонтёров удалится вместе с ним.`);
console.log("Животные, проекты и закупки, которые он вносил, останутся.");
stopUnlessApply(apply);

const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
if (deleteError) {
  console.error(`Не удалось удалить вход: ${deleteError.message}`);
  process.exit(1);
}

const { data: stillVolunteer, error: checkError } = await supabase.from("volunteers").select("user_id").eq("user_id", user.id).maybeSingle();
const stillUser = await findUser(email);
if (checkError || stillVolunteer || stillUser) {
  console.error("Проверка не прошла: вход или запись волонтёра ещё есть. Посмотрите в Supabase → Authentication → Users.");
  process.exit(1);
}
console.log(`Готово: входа ${email} больше нет, в списке волонтёров его нет.`);
console.log("Уже открытая у него страница панели может открываться до часа, но менять данные он не может.");

import type { Database } from "@/types/database";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const [email] = process.argv.slice(2);

if (!url || !serviceKey || !email) {
  console.error(
    "Использование: node --env-file=.env.coordinator scripts/reset-2fa.ts почта",
  );
  process.exit(1);
}

const supabase = createClient<Database>(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: usersData, error: usersError } =
  await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });

if (usersError) {
  console.error(usersError.message);
  process.exit(1);
}

const user = usersData.users.find(
  (u) => u.email?.toLowerCase() === email.toLowerCase(),
);

if (!user) {
  console.error("Пользователь с такой почтой не найден среди первых 1000.");
  process.exit(1);
}

const { data: membership, error: membershipError } = await supabase
  .from("shelter_members")
  .select("shelter_id")
  .eq("user_id", user.id)
  .limit(1);

if (membershipError) {
  console.error(membershipError.message);
  process.exit(1);
}

if (membership.length === 0) {
  console.error(
    "Этот пользователь не состоит ни в одном приюте. Сброс отменён.",
  );
  process.exit(1);
}

const { data: factorsData, error: factorsError } =
  await supabase.auth.admin.mfa.listFactors({ userId: user.id });

if (factorsError) {
  console.error(factorsError.message);
  process.exit(1);
}

for (const factor of factorsData.factors) {
  const { error } = await supabase.auth.admin.mfa.deleteFactor({
    id: factor.id,
    userId: user.id,
  });

  if (error) {
    console.error(`Не удалось удалить фактор ${factor.id}: ${error.message}`);
    process.exit(1);
  }
}

console.log(`Удалено факторов: ${factorsData.factors.length}`);
console.log("Попросите человека сразу войти и заново настроить приложение.");

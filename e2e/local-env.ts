import { createClient } from "@supabase/supabase-js";
import { totp } from "./totp.ts";

const EMAIL = "volunteer@example.org";
const PASSWORD = "local-test-password";
const url = process.env.SUPABASE_URL ?? "";
const anonKey = process.env.SUPABASE_ANON_KEY ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const host = URL.canParse(url) ? new URL(url).hostname : "";
if (host !== "127.0.0.1" && host !== "localhost") {
  console.error(`Отказ: SUPABASE_URL должен указывать на локальную базу, а сейчас: «${host || "не задан"}».`);
  process.exit(1);
}
if (!anonKey || !serviceKey) {
  console.error("Отказ: в .dev.vars нет SUPABASE_ANON_KEY или SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const client = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
const { error: signInError } = await client.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
if (signInError) {
  console.error(`Не удалось войти тестовым волонтёром (сначала seed-local.ts): ${signInError.message}`);
  process.exit(1);
}
const { data: enrolled, error: enrollError } = await client.auth.mfa.enroll({ factorType: "totp" });
if (enrollError) {
  console.error(`Не удалось настроить второй фактор (он уже настроен? повторите seed-local.ts на чистой базе): ${enrollError.message}`);
  process.exit(1);
}
const { error: verifyError } = await client.auth.mfa.challengeAndVerify({ factorId: enrolled.id, code: totp(enrolled.totp.secret) });
if (verifyError) {
  console.error(`Не удалось подтвердить второй фактор: ${verifyError.message}`);
  process.exit(1);
}

console.log(`E2E_EMAIL=${EMAIL}`);
console.log(`E2E_PASSWORD=${PASSWORD}`);
console.log(`E2E_TOTP_SECRET=${enrolled.totp.secret}`);
console.log(`E2E_CRON_SECRET=${process.env.CRON_SECRET ?? ""}`);
console.log(`E2E_SUPABASE_URL=${url}`);
console.log(`E2E_SERVICE_ROLE_KEY=${serviceKey}`);

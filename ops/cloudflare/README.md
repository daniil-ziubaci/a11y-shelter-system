# Хостинг на Cloudflare Workers

Сайт: `https://a11y-shelter-system.priyut-md.workers.dev` (Worker `a11y-shelter-system`, поддомен аккаунта `priyut-md`). Сайт на Astro собирается адаптером `@astrojs/cloudflare` (`npm run build`), и Cloudflare сам выкладывает его при каждом изменении ветки `main` (Workers Builds). Ключи и пароли хранятся только в панели Cloudflare.

## Переменные — только Runtime variables

Сборке переменные не нужны: Astro читает их во время работы (`astro:env`, все объявлены как `access: "secret"`). Поэтому в **Settings → Builds → Variables** нужна только `NODE_VERSION`, а всё остальное — в **Runtime variables and secrets**. Если сайт отвечает 500 на всех страницах, а `/api/health` — нет, проверьте `SITE_URL` в Runtime variables.

## Первая настройка (один раз)

### 1. Создать Worker из репозитория

Cloudflare → **Workers & Pages** → **Create** → **Import a repository**. Подключите GitHub и выберите `a11y-shelter-system`.

| Поле | Значение |
|---|---|
| Project name | `a11y-shelter-system` (должно совпадать с `name` в `wrangler.jsonc`) |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Preview command | `npx wrangler versions upload` (предпросмотр веток без выкладки на сайт) |
| Path | `/` |
| API token | Create new token (им Cloudflare сам выкладывает сайт) |

Адрес: вкладка **Domains** → **Production** включить, **Preview** выключить. Поддомен аккаунта меняется на странице **Workers & Pages** → **Your subdomain** → **Change**.

### 2. Переменные сборки

Settings → **Builds** → Variables: только `NODE_VERSION` = `24`. Секреты и адреса сюда не добавлять.

### 3. Переменные и секреты работающего сайта

Settings → **Runtime variables and secrets** → **+ Add variable** (вкладка **Production**). Тип **Secret** для ключей, **Text** для остального. `wrangler.jsonc` задаёт `keep_vars`, поэтому выкладка из GitHub их не стирает. Жёлтую подсказку Cloudflare «перенести переменные в wrangler.jsonc» можно закрыть.

| Имя | Тип | Где взять значение |
|---|---|---|
| `SUPABASE_URL` | Text | `https://<проект>.supabase.co` |
| `SUPABASE_ANON_KEY` | Text | публичный ключ Supabase `sb_publishable_…` (Project Settings → API Keys) |
| `SITE_URL` | Text | адрес сайта |
| `ALLOW_INDEXING` | Text | `false`, пока сайт не открыт для людей |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | файл `.env.coordinator` или Supabase → Project Settings → API Keys (secret / service_role) |
| `CRON_SECRET` | Secret | новая случайная строка: `openssl rand -hex 32` |
| `DEEPL_API_KEY` | Secret | deepl.com → Account → API Keys |

Значение секрета после сохранения не показывается никому. Если он потерян, создайте новый в первоисточнике и замените.

### 4. Адрес сайта в других местах

- Supabase → **Authentication** → **URL Configuration**: **Site URL** — адрес сайта, в **Redirect URLs** — адрес с `/**` на конце.
- `.env.coordinator` у координатора: `SITE_URL` — адрес сайта. Из него `scripts/invite-volunteer.ts` строит ссылки-приглашения.
- UptimeRobot: монитор на `<адрес сайта>/api/health`.

## Что работает само

- **Расписания** (`triggers` в `wrangler.jsonc`, обработчик `src/worker.ts`): в 02:00 UTC ночной перевод `/api/cron/translate` (с `CRON_SECRET`), в 14:00 UTC запрос к базе `/api/health`, чтобы бесплатный Supabase не уснул. Журнал: Worker → **Observability**.
- **Перевод вручную**, не дожидаясь ночи: `curl -H "Authorization: Bearer <CRON_SECRET>" <адрес сайта>/api/cron/translate`. Ответ — сколько записей переведено, например `{"shelters":0,"items":0,"projects":1,"pets":0}`.
- **Картинки** отдаются из хранилища как есть (`imageService: "passthrough"` в `astro.config.mjs`): у Workers нет бесплатного оптимизатора, а фото и так уменьшены при загрузке.
- **Кэш страниц**: публичные страницы помечены для кэша Worker на 60 с (тег `public`), любое сохранение в панели сбрасывает тег. Работает ли этот кэш на `*.workers.dev` и бесплатном тарифе, не проверено: локально кэш выключен.
- **Проверка расписаний локально**: `npx wrangler dev --test-scheduled`, затем `curl "http://localhost:8787/cdn-cgi/handler/scheduled?cron=0+2+*+*+*"`.

## Лимиты бесплатного тарифа и за чем следить

| Лимит | Как обстоит дело |
|---|---|
| 100 000 запросов в сутки (один просмотр каталога — около 17 запросов из-за фоновой подгрузки ссылок) | Worker → Metrics |
| 10 мс процессорного времени на запрос | **превышен**: сайт тратит 15–120 мс, иногда до 1 с (замер 12.11.2026). Cloudflare пока не отклонил ни одного запроса, но гарантии нет. Перед открытием сайта для людей — Workers Paid |
| размер Worker до 3 МиБ в сжатом виде | Astro: около 0,5 МиБ (`wrangler deploy --dry-run`: gzip 498 КиБ; было около 1,8 МиБ на Next) |

Раз в неделю смотрите метрики, особенно ошибки (Worker → Metrics → Errors). Следующий шаг при проблемах — Workers Paid (около $5 в месяц): 30 с CPU на запрос, без суточного лимита запросов.

## Откат

Worker → **Deployments**: у каждой выкладки есть **Rollback** к предыдущей версии.

# Хостинг на Cloudflare Workers

Сайт: `https://a11y-shelter-system.priyut-md.workers.dev` (Worker `a11y-shelter-system`, поддомен аккаунта `priyut-md`). Сайт собирается адаптером OpenNext (`npm run cf:build`), и Cloudflare сам выкладывает его при каждом изменении ветки `main` (Workers Builds). Ключи и пароли хранятся только в панели Cloudflare.

## ⚠️ Два набора переменных — не путать

На вкладке **Settings** у Worker два похожих раздела, и они **не связаны** между собой:

| Раздел | Для чего | Что там |
|---|---|---|
| **Runtime variables and secrets** (вверху Settings, вкладка Production) | работающий сайт | все 7 переменных, включая 3 секрета |
| **Builds** → Variables (в меню Settings справа → Builds) | только сборка | 5 переменных, **без секретов** |

Переменная из раздела сборки до работающего сайта **не доходит**. Если сайт отвечает 500 на всех страницах (даже на `/login`), а `/api/health` отвечает `ok`, первым делом проверьте, что `SITE_URL` есть в **Runtime variables**: без неё падает общий макет страниц (`app/layout.tsx`).

## Первая настройка (один раз)

### 1. Создать Worker из репозитория

Cloudflare → **Workers & Pages** → **Create** → **Import a repository**. Подключите GitHub и выберите `a11y-shelter-system`.

| Поле | Значение |
|---|---|
| Project name | `a11y-shelter-system` (должно совпадать с `name` в `wrangler.jsonc`) |
| Build command | `npx opennextjs-cloudflare build` |
| Deploy command | `npx opennextjs-cloudflare deploy` |
| Preview command | `npx opennextjs-cloudflare upload` (предпросмотр веток без выкладки на сайт) |
| Path | `/` |
| API token | Create new token (им Cloudflare сам выкладывает сайт) |

Адрес: вкладка **Domains** → **Production** включить, **Preview** выключить. Поддомен аккаунта меняется на странице **Workers & Pages** → **Your subdomain** → **Change**.

### 2. Переменные сборки

Settings → **Builds** → Variables. `NEXT_PUBLIC_*` подставляются в код во время сборки, поэтому без них сборка упадёт. Секреты сюда **не добавлять**: при сборке они не нужны.

| Имя | Значение |
|---|---|
| `NODE_VERSION` | `24` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://czbuyirmoixortuhlekv.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | публичный ключ Supabase `sb_publishable_…` (Project Settings → API Keys) |
| `SITE_URL` | адрес сайта |
| `ALLOW_INDEXING` | `false`, пока сайт не открыт для людей |

### 3. Переменные и секреты работающего сайта

Settings → **Runtime variables and secrets** → **+ Add variable** (вкладка **Production**). Тип **Secret** для ключей, **Text** для остального. `wrangler.jsonc` задаёт `keep_vars`, поэтому выкладка из GitHub их не стирает. Жёлтую подсказку Cloudflare «перенести переменные в wrangler.jsonc» можно закрыть.

| Имя | Тип | Где взять значение |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Text | как в сборке |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Text | как в сборке |
| `SITE_URL` | Text | адрес сайта |
| `ALLOW_INDEXING` | Text | как в сборке |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | файл `.env.coordinator` или Supabase → Project Settings → API Keys (secret / service_role) |
| `CRON_SECRET` | Secret | новая случайная строка: `openssl rand -hex 32` |
| `DEEPL_API_KEY` | Secret | deepl.com → Account → API Keys |

Значение секрета после сохранения не показывается никому. Если он потерян, создайте новый в первоисточнике и замените.

### 4. Адрес сайта в других местах

- Supabase → **Authentication** → **URL Configuration**: **Site URL** — адрес сайта, в **Redirect URLs** — адрес с `/**` на конце.
- `.env.coordinator` у координатора: `SITE_URL` — адрес сайта. Из него `scripts/invite-volunteer.ts` строит ссылки-приглашения.
- UptimeRobot: монитор на `<адрес сайта>/api/health`.

## Что работает само

- **Расписания** (`triggers` в `wrangler.jsonc`, обработчик `cloudflare/worker.js`): в 02:00 UTC ночной перевод `/api/cron/translate` (с `CRON_SECRET`), в 14:00 UTC запрос к базе `/api/health`, чтобы бесплатный Supabase не уснул. Журнал: Worker → **Observability**.
- **Перевод вручную**, не дожидаясь ночи: `curl -H "Authorization: Bearer <CRON_SECRET>" <адрес сайта>/api/cron/translate`. Ответ — сколько записей переведено, например `{"shelters":0,"items":0,"projects":1,"pets":0}`.
- **Картинки** отдаются из хранилища как есть (`images.unoptimized` в `next.config.ts`): у Workers нет бесплатного оптимизатора, а фото и так уменьшены при загрузке.

## Лимиты бесплатного тарифа и за чем следить

| Лимит | Как обстоит дело |
|---|---|
| 100 000 запросов в сутки (один просмотр каталога — около 17 запросов из-за фоновой подгрузки ссылок) | Worker → Metrics |
| 10 мс процессорного времени на запрос | **превышен**: сайт тратит 15–120 мс, иногда до 1 с (замер 12.11.2026). Cloudflare пока не отклонил ни одного запроса, но гарантии нет. Перед открытием сайта для людей — Workers Paid |
| размер Worker до 3 МиБ в сжатом виде | около 1,8 МиБ, видно в журнале сборки |

Раз в неделю смотрите метрики, особенно ошибки (Worker → Metrics → Errors). Следующий шаг при проблемах — Workers Paid (около $5 в месяц): 30 с CPU на запрос, без суточного лимита запросов.

## Откат

Worker → **Deployments**: у каждой выкладки есть **Rollback** к предыдущей версии.

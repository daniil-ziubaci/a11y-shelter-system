# Хостинг на Cloudflare Workers

Сайт собирается адаптером OpenNext (`npm run cf:build`), и Cloudflare сам выкладывает его при каждом изменении ветки `main` (Workers Builds), как раньше Vercel. Ключи и пароли хранятся только в панели Cloudflare.

## Первая настройка (один раз)

### 1. Создать Worker из репозитория

Cloudflare → **Workers & Pages** → **Create** → **Import a repository**. Подключите GitHub и выберите `a11y-shelter-system`.

| Поле | Значение |
|---|---|
| Project name | `a11y-shelter-system` (должно совпадать с `name` в `wrangler.jsonc`) |
| Production branch | `main` |
| Build command | `npx opennextjs-cloudflare build` |
| Deploy command | `npx opennextjs-cloudflare deploy` |
| Non-production branch deploy command | `npx wrangler versions upload` (предпросмотр веток без выкладки на сайт) |

### 2. Переменные для сборки (Build variables)

Settings → **Build** → **Variables and secrets**. `NEXT_PUBLIC_*` подставляются в код во время сборки, поэтому без них сборка упадёт.

| Имя | Значение |
|---|---|
| `NODE_VERSION` | `24` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://czbuyirmoixortuhlekv.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | публичный ключ Supabase (Project Settings → API) |
| `SITE_URL` | адрес сайта на Cloudflare, например `https://a11y-shelter-system.<поддомен>.workers.dev` |
| `ALLOW_INDEXING` | `false`, пока сайт не открыт для людей |

### 3. Переменные и секреты работающего сайта

Settings → **Variables and secrets** (не Build). Тип **Secret** для ключей, **Text** для остального. `wrangler.jsonc` задаёт `keep_vars`, поэтому выкладка их не стирает.

| Имя | Тип | Значение |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Text | как в сборке |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Text | как в сборке |
| `SITE_URL` | Text | как в сборке |
| `ALLOW_INDEXING` | Text | как в сборке |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | Supabase → Project Settings → API → service_role |
| `CRON_SECRET` | Secret | длинная случайная строка, та же, что на Vercel |
| `DEEPL_API_KEY` | Secret | ключ DeepL, тот же, что на Vercel |

Значения для этих полей можно взять в Vercel → проект → Settings → Environment Variables.

### 4. Supabase: адрес сайта для входа

Supabase → **Authentication** → **URL Configuration** → **Redirect URLs**: добавьте адрес на Cloudflare с `/**` на конце. Без этого ссылки-приглашения волонтёров ведут на старый адрес. Site URL меняется на новый адрес, когда Vercel выключается.

## Что работает само

- **Расписания** (`triggers` в `wrangler.jsonc`, обработчик `cloudflare/worker.js`): в 02:00 UTC ночной перевод `/api/cron/translate` (с `CRON_SECRET`), в 14:00 UTC запрос к базе `/api/health`, чтобы бесплатный Supabase не уснул. Журнал: Worker → **Logs**.
- **Картинки** отдаются из хранилища как есть (`images.unoptimized` в `next.config.ts`): у Workers нет бесплатного оптимизатора, а фото и так уменьшены при загрузке.

## Лимиты бесплатного тарифа и за чем следить

| Лимит | Сейчас |
|---|---|
| 100 000 запросов в сутки (один просмотр каталога — около 17 запросов из-за фоновой подгрузки ссылок) | Worker → Metrics |
| 10 мс процессорного времени на запрос | Worker → Metrics → CPU time |
| размер Worker до 3 МиБ в сжатом виде | около 1,8 МиБ, видно в журнале сборки |

Раз в неделю смотрите метрики. Если какой-то лимит подходит к 70%, следующий шаг — Workers Paid (около $5 в месяц).

## Откат

Worker → **Deployments**: у каждой выкладки есть **Rollback**. Пока Vercel не выключен, старый адрес тоже работает.

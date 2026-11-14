# Хостинг на Cloudflare Workers

Сайт: `https://a11y-shelter-system.priyut-md.workers.dev` (Worker `a11y-shelter-system`, поддомен аккаунта `priyut-md`). Сайт на Astro собирается адаптером `@astrojs/cloudflare` (`npm run build`), и Cloudflare сам выкладывает его при каждом изменении ветки `main` (Workers Builds). Ключи и пароли хранятся только в панели Cloudflare.

## Переменные — только Runtime variables

Сборке переменные не нужны: Astro читает их во время работы (`astro:env`, все объявлены как `access: "secret"`). Поэтому в **Settings → Builds → Variables** нужна только `NODE_VERSION`, а всё остальное — в **Runtime variables and secrets**. Если сайт отвечает 500 на всех страницах, а `/api/health` — нет, проверьте `SITE_URL` в Runtime variables.

## Переход работающего Worker со старого сайта (Next) на Astro

Проверено через API Cloudflare 13.11.2026 (только чтение): у Worker `a11y-shelter-system` один триггер сборки, только ветка `main`, сборки других веток выключены. Но команды в нём **ещё от старого сайта**: `npx opennextjs-cloudflare build` и `npx opennextjs-cloudflare deploy`. Если влить `astro` в `main`, не поменяв их, автоматическая выкладка упадёт, а на сайте останется прошлая версия.

В момент перехода, **вместе** с вливанием (не раньше: старый сайт на этих командах работает):

1. Worker → **Settings** → **Builds** → Build command: `npm run build`, Deploy command: `npx wrangler deploy`.
2. Runtime variables: новые имена (таблица ниже) и ключи **нового** проекта Supabase `live-life`. Старые `NEXT_PUBLIC_SUPABASE_URL` и `NEXT_PUBLIC_SUPABASE_ANON_KEY` удалить после проверки.
3. Проверки после выкладки — раздел «Как проверить кэш и заголовки» ниже.

## Первая настройка (один раз)

### 1. Создать Worker из репозитория

Cloudflare → **Workers & Pages** → **Create** → **Import a repository**. Подключите GitHub и выберите `a11y-shelter-system`.

| Поле | Значение |
|---|---|
| Project name | `a11y-shelter-system` (должно совпадать с `name` в `wrangler.jsonc`) |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Non-production branch builds | **выключено**: собирается и выкладывается только `main` |
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
- **Кэш страниц**: публичные страницы помечены для кэша Worker на 60 с (`Cloudflare-CDN-Cache-Control: public, max-age=60, stale-while-revalidate=60`, тег `public`); любое сохранение в панели сбрасывает тег (`Astro.cache.invalidate`, внутри адаптер вызывает `cache.purge` из `cloudflare:workers`). В локальном `wrangler dev` функции `cache.purge` нет, поэтому там в журнале строка `background task failed … cache.purge is not a function` — на сохранение она не влияет. Работает ли кэш и его сброс на `*.workers.dev`, не проверено.
- **Не кэшируются никогда** (`Cache-Control: no-store`): переход по языку на `/` (ещё `Vary: Accept-Language`), панель `/volunteer`, вход `/login`, `/auth`, `/api`. Это проверяет `e2e/cache-headers.spec.ts`.
- **Проверка расписаний локально**: `npx wrangler dev --test-scheduled`, затем `curl "http://localhost:8787/cdn-cgi/handler/scheduled?cron=0+2+*+*+*"`.

## Лимиты бесплатного тарифа и за чем следить

| Лимит | Как обстоит дело |
|---|---|
| 100 000 запросов в сутки (на Astro один просмотр страницы — один запрос к Worker; на Next было около 17 из-за фоновой подгрузки ссылок) | Worker → Metrics |
| 10 мс процессорного времени на запрос | старый сайт (Next): 15–120 мс на хостинге (12.11.2026). Astro по локальному замеру тратит в 3–5 раз меньше: 7–18 мс, на большинстве страниц всё ещё больше 10 мс (13.11.2026, `docs/ASTRO-PORT-REPORT.md`). На хостинге не проверено. Если после выкладки в Metrics выше 10 мс — Workers Paid |
| размер Worker до 3 МиБ в сжатом виде | Astro: около 0,5 МиБ (`wrangler deploy --dry-run`: gzip 498 КиБ; было около 1,8 МиБ на Next) |

Раз в неделю смотрите метрики, особенно ошибки (Worker → Metrics → Errors). Следующий шаг при проблемах — Workers Paid (около $5 в месяц): 30 с CPU на запрос, без суточного лимита запросов.

## Как проверить кэш и заголовки после выкладки

1. Публичная страница кэшируется — выполните два раза подряд `curl -sI https://<адрес сайта>/ru/needs`: должно быть `cf-cache-status: MISS`, затем `HIT`, и `cache-tag: public,…`. Если `cf-cache-status` нет или всегда `DYNAMIC`, кэш на этом адресе не работает: сайт работает, но каждый просмотр тратит процессорное время.
2. Сброс кэша — измените что-нибудь в панели (например, количество в нуждах) и обновите `/ru/needs`: изменение видно через несколько секунд, а не через 1–2 минуты. В Worker → Logs не должно быть `background task failed … cache.purge`.
3. Переход по языку — `curl -sI -H 'Accept-Language: ro' https://<адрес сайта>/`: `location: /ro`, `cache-control: no-store`, `vary: Accept-Language`.
4. Приватные страницы — `curl -sI https://<адрес сайта>/login`: `cache-control: no-store`, никогда `cf-cache-status: HIT`.
5. Защитные заголовки — в ответе того же `curl -sI https://<адрес сайта>/login` и любой публичной страницы: `x-content-type-options: nosniff`, `x-frame-options: DENY`, `content-security-policy: frame-ancestors 'none'`, `referrer-policy: strict-origin-when-cross-origin`. Это проверяет и `e2e/cache-headers.spec.ts`.

## Откат

Worker → **Deployments**: у каждой выкладки есть **Rollback** к предыдущей версии.

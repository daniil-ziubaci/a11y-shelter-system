# План переноса на Astro (один приют, без multitenant)

Ветка `astro`. Отчёт по этапам: `docs/ASTRO-PORT-REPORT.md`.

## 1. Опись текущего сайта (Next 16 + OpenNext, ветка `main`, 13.11.2026)

### Публичные страницы (языки `ru`, `ro`, `en`, язык по умолчанию `ru`)

| Старый адрес | Что делает сейчас | Параметры |
|---|---|---|
| `/` | 307 на `/{язык}` по `Accept-Language`, иначе `/ru` | |
| `/{язык}` | приютов один → 307 на `/{язык}/shelter/live-life`; несколько → список | |
| `/{язык}/` | 308 на `/{язык}` | |
| `/shelter/…`, `/privacy` без языка | 307 на `/ru/…` | |
| `/{язык}/shelter/live-life` | главная приюта | |
| `/{язык}/shelter/live-life/catalog` | каталог | `species`, `sex`, `age`, `size`, `mode=treatment`, `group=blocked`, `q`, `page` |
| `/{язык}/shelter/live-life/catalog/{uuid}` | страница животного; `снят с учёта` и чужие → 404 | |
| `/{язык}/shelter/live-life/needs` | нужды | `category`, `shown`, `urgent=1` |
| `/{язык}/shelter/live-life/projects` | проекты | |
| `/{язык}/shelter/live-life/about` | о приюте, галерея, JSON-LD | |
| `/{язык}/privacy` | политика | |
| `/{язык}/<прочее>` | 404 | |

На живом сайте каталог пуст, на странице проектов три проекта, поэтому разосланными могут быть только адреса из таблицы, не страницы животных.

### Служебное

| Адрес | Что делает |
|---|---|
| `/login` | вход по почте и паролю |
| `/auth/confirm?token_hash&type=invite` | ссылка-приглашение → `/auth/set-password` |
| `/auth/set-password` | первый пароль |
| `/volunteer` (+ `/pets/new`, `/pets/{id}/edit`) | животные |
| `/volunteer/needs` (+ `/open`, `/stock`, `/closed?archived=1`, `/new`, `/{id}/edit?from=`) | закупки |
| `/volunteer/projects?archived=1` (+ `/new`, `/{id}/edit`) | проекты |
| `/volunteer/2fa`, `/volunteer/2fa/verify` | настройка и ввод TOTP |
| `/api/health` | запрос к базе, `{"status":"ok"}` |
| `/api/cron/translate` | ночной перевод, `Authorization: Bearer CRON_SECRET`, ответ с полем `deepl` |
| `/robots.txt`, `/sitemap.xml` | sitemap пуст, пока `ALLOW_INDEXING≠true` |
| `/shelters/live-life/gallery/*.webp` | статичные фото галереи (пути записаны в базе) |

Middleware (`proxy.ts`): для `/volunteer/*` обновляет сессию Supabase, без входа → `/login`, без `aal2` → `/volunteer/2fa` или `/2fa/verify`. Заголовок `X-Robots-Tag: noindex, nofollow` на всём, пока `ALLOW_INDEXING≠true`.

### Расписания (Cloudflare `triggers`)

- `0 2 * * *` → `/api/cron/translate` с `CRON_SECRET`;
- `0 14 * * *` → `/api/health`, чтобы бесплатный Supabase не уснул.

### Переменные окружения

| Имя сейчас | Где | Секрет |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | сборка и работа | нет |
| `SITE_URL`, `ALLOW_INDEXING` | сборка и работа | нет |
| `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `DEEPL_API_KEY` | только работа | да |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SITE_URL` | `.env.coordinator` для скриптов | да |

### Скрипты координатора (`scripts/`)

`create-shelter`, `delete-shelter`, `move-projects`, `move-volunteer` (только для нескольких приютов); `invite-volunteer`, `reset-2fa`, `create-project`, `edit-project`, `load-needs`, `load-gallery`, `set-shelter-brand`, `upload-shelter-photo`, `add-card-copies`, `add-preview-copies` (+ `scripts/lib/*`, где `sharp` разрешён).

### Зависимости

`next 16.4.5`, `next-intl`, `@opennextjs/cloudflare`, `@supabase/ssr 0.12`, `@supabase/supabase-js 2.118`, `react 19.2`, `simple-icons`, Tailwind 4, `wrangler`, `sharp` (только скрипты), Playwright + axe.

### База (`supabase/migrations`, 13 файлов)

Таблицы `shelters` (multitenant, `slug`), `shelter_members`, `pets`, `pet_internal`, `projects`, `purchase_items`, `purchase_log`, `shelter_photos`, вид `volunteer_pets`, функции `receive_purchase`, `record_consumption`, `undo_purchase`, `translit_ru` и триггеры. Хранилище `pet-photos`, папка = `shelter_id`. Тесты pgTAP: **49 файлов, 499 проверок, все проходят** (замер на локальном Supabase этой сессии).

## 2. Решения

1. **Адреса.** Новые адреса без slug: `/{язык}`, `/{язык}/catalog`, `/{язык}/catalog/{id}`, `/{язык}/needs`, `/{язык}/projects`, `/{язык}/about`, `/{язык}/privacy`. Все старые `/{язык}/shelter/live-life/…` отвечают **301** на новый адрес с тем же хвостом и параметрами, так разосланные ссылки продолжают работать. Старый slug отличный от `live-life` → 404. Служебные адреса (`/login`, `/auth/*`, `/volunteer/*`, `/api/*`) не меняются.
2. **База.** Одна начальная миграция. Данные приюта в таблице `shelter` с одной строкой (`id boolean primary key default true check (id)`). Волонтёры в `volunteers(user_id)`. В остальных таблицах нет `shelter_id`. RLS: анонимы читают только опубликованное и только если приют опубликован; волонтёры читают своё без 2FA, пишут только с `aal2`; запас меняется только функциями. Фото: новые файлы в `animals/…` и `projects/…`, старые пути переносятся как есть.
3. **Перенос данных** `ops/migrate/`: источник — копия из `ops/backup` (восстанавливается в одноразовый локальный Supabase через `restore.sh`) или строка подключения к старой базе; цель — новый пустой проект. Без `--apply` только план. Переносятся пользователи входа с паролями и TOTP, фото, затем сверка.
4. **Astro.** `output: "server"` с адаптером `@astrojs/cloudflare`, встроенный `i18n` (`ru`, `ro`, `en`, префикс всегда). Публичные страницы — серверный HTML без JS, кроме галереи и меню (небольшие скрипты или острова). Кэш: публичные страницы отдаются с `Cache-Control: public, s-maxage` коротким сроком и сбрасываются при правке волонтёром (подробности — в отчёте этапа 2). Панель — HTML-формы с POST на ту же страницу (работают без JS), React-острова только там, где без JS нельзя: фото (уменьшение в браузере), форма животного (размер собаки), 2FA.
5. **Переменные**: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SITE_URL`, `CRON_SECRET`, `DEEPL_API_KEY`, `ALLOW_INDEXING`, все только в Runtime variables (Astro читает их во время работы через `astro:env`).

## 3. Этапы

0. Опись (этот файл).
1. Миграция, RLS, pgTAP (не меньше 499 проверок по смыслу), скрипт переноса.
2. Приложение на Astro.
3. Фото и превью (1600 / 800 / 1200×630 в браузере, сервер только проверяет).
4. Cloudflare: `wrangler.jsonc`, расписания.
5. Скрипты координатора под один приют.
6. Резервные копии: параметры в секреты.
7. Проверка и сравнение с Next.

# Отчёт: перенос на Astro без multitenant

Ветка `astro`, коммиты не отправлены. План и опись: `docs/astro-port-plan.md`.

## Этап 0. Опись

Сделано: опись маршрутов, API, расписаний, переменных, скриптов, зависимостей и базы; решение по адресам (новые без slug, старые отвечают 301).

Проверки:

```
$ npx -y supabase@2.122.0 test db        # старая схема, локальный Supabase
Files=49, Tests=499, …
Result: PASS
```

Живой сайт (только чтение, GET):

```
/                      307 → /ru
/ru                    307 → /ru/shelter/live-life
/ro/                   308 → /ro
/en                    307 → /en/shelter/live-life
/shelter/live-life     307 → /ru/shelter/live-life
/ru/shelter/live-life  200
/ru/privacy            200
/robots.txt /sitemap.xml /api/health /login  200
/volunteer             307 → /login
/ru/nothing            404
/ru/shelter/live-life/catalog → «Подходящих животных нет.» (страниц животных нет)
```

В задании сказано про 415 проверок pgTAP; сейчас их 499, сравнение ведётся с 499.

## Этап 1. База без multitenant

Сделано:

- Одна начальная миграция `supabase/migrations/20261113000000_single_shelter.sql`, старые 13 миграций и `supabase/down` удалены из ветки.
- `shelter` — одна строка (`id boolean primary key default true`, `check (id)`): название, реквизиты, контакты, город, язык контента, переводы, `is_published`. Slug нет.
- `volunteers(user_id)` вместо `shelter_members`; `shelter_photos` → `gallery_photos`; ни в одной таблице нет `shelter_id` (это проверяет тест).
- Права заново: аноним читает только опубликованное и только пока приют опубликован; волонтёр читает всё без 2FA, пишет только с `aal2` (теперь и вольеры: в старой схеме вольеры можно было менять без второго фактора); запас меняют только `receive_purchase` / `record_consumption` / `undo_purchase`; строку приюта, список волонтёров, галерею и закрепление проектов меняет только service role. Новые фото — в папки `animals/` и `projects/`, старые файлы сохраняют пути.
- Изменение поведения: в старой схеме аноним видел животных неопубликованного приюта (политика `using (true)`), теперь не видит.
- `ops/migrate/migrate.sh` переносит приют из копии `ops/backup` (через `restore.sh` во временный Supabase) или из старой базы в новый пустой проект. Без `--apply` — только план.

Проверка pgTAP (новая схема):

```
$ npx -y supabase@2.122.0 db reset --local && npx -y supabase@2.122.0 test db
Files=32, Tests=543, …
Result: PASS
```

Было 49 файлов / 499 проверок. Проверки про «чужой приют» стали проверками про «вошедшего не-волонтёра»; добавлены: одна строка приюта, скрытый приют (аноним и не-волонтёр не видят животных, проекты, нужды, галерею), отсутствие `shelter_id`, RLS на всех таблицах, нет прав записи у анонима, `search_path` у security definer функций, папки хранилища.

Проверка переноса (локально, данные-заготовка: 2 приюта, 3 волонтёра, 2 с TOTP, 34 животных, 110 фото):

```
$ ops/backup/backup.sh                      # старая схема → db/2026-11-13.tar.gz.gpg + photos/
Photos in storage: 110, new: 110, failed: 0
$ ops/migrate/migrate.sh --slug live-life --backup db/2026-11-13.tar.gz.gpg --photos photos
Plan: shelter «live-life» (11111111-1111-4111-8111-111111111111)
  from: http://127.0.0.1:55321
  to:   http://127.0.0.1:54321
  shelter          1
  volunteers       2
  pets             30
  pet_internal     10
  projects         4
  purchase_items   28
  purchase_log     5
  gallery_photos   6
  sign-in users    2 (with password and 1 verified second factors)
  photos           98
  pet photo addresses are rewritten to the new project
Left in the source: 1 other shelter(s), 1 sign-in user(s) without this shelter
Target now: 0 site rows, 0 sign-in users, 0 photos
Nothing changed. Run again with --apply to move the data.
$ ops/migrate/migrate.sh … --apply
Photos copied: 98, failed: 0
== Comparing the target with the source
PASS  shelter: 1 of 1 rows
PASS  volunteers: 2 of 2 rows
PASS  pets: 30 of 30 rows
PASS  pet_internal: 10 of 10 rows
PASS  projects: 4 of 4 rows
PASS  purchase_items: 28 of 28 rows
PASS  purchase_log: 5 of 5 rows
PASS  gallery_photos: 6 of 6 rows
PASS  sign-in users: 2 of 2, e-mails and password hashes identical
PASS  second factors: 1 of 1 verified, secrets identical
PASS  sign-in identities identical
PASS  animals identical (names, statuses, photo addresses, translations)
PASS  needs identical (names, remaining amounts, translations)
PASS  projects identical (titles, statuses, completion and creation dates)
PASS  photos in storage: 98 of 98
PASS  photos served byte for byte: 98 of 98
PASS  every animal photo opens at its new address (0 broken)
MIGRATION CHECK PASSED
$ node login-check.mjs   # разовая проверка через supabase-js (рабочая папка сессии, не в репозитории)
password sign-in: ok
after password: aal1 next: aal2
TOTP with the old secret: ok
aal2 write as volunteer: 1 row updated
wrong password: refused
volunteer of the other shelter: not moved (refused)
```

Не проверено: перенос из настоящей копии боевого проекта (нет доступа и нельзя по заданию) и на хостинге Supabase (нет ключей нового проекта `live-life`).

## Этап 2. Приложение на Astro

Сделано:

- Astro 7.4.11, `output: "server"`, `@astrojs/cloudflare` 14.4.7, `@astrojs/react` 7.1.8, Tailwind 4 через `@tailwindcss/vite`. Next, next-intl и OpenNext удалены.
- Многоязычность: встроенный `i18n` Astro (`ru`, `ro`, `en`, `routing: "manual"`), маршрут `src/pages/[locale]/…`, сообщения прежние (`src/messages/*.json`), небольшой форматтер ICU (`plural`, `select`, теги ссылок) в `src/lib/i18n.ts`.
- Адреса: `/` → 307 на язык из `Accept-Language` (как раньше); `/{язык}` — теперь сама главная (200 вместо 307); все `/{язык}/shelter/live-life/…` → **301** на адрес без slug с теми же параметрами; `/shelter/live-life/…` → 301 на `/ru/…`; `/privacy`, `/catalog` и др. без языка → 307 на `/ru/…`; другой slug → 404; `/{язык}/` → 301 без косой черты (было 308).
- Публичные страницы — серверный HTML. JavaScript только у меню (~1 КБ) и галереи на «О приюте» (обычный скрипт, не React). Без JS меню на телефоне закрыто, ссылки остаются в подвале. Шрифт Nunito теперь свой (`src/assets/fonts`, OFL), без запросов к Google.
- Кэш: публичные страницы помечены `Astro.cache.set({ maxAge: 60, swr: 60, tags: ["public"] })` (поставщик `cacheCloudflare()` адаптера: заголовки `Cloudflare-CDN-Cache-Control` и `Cache-Tag`), любое сохранение в панели сбрасывает тег `public` (`cache.purge`). Строка приюта дополнительно кэшируется в памяти Worker на 60 с. Панель и API — `no-store` (адаптер ставит его сам, если маршрут не просит кэша). **Не проверено**: работает ли кэш Worker на `*.workers.dev` и на бесплатном тарифе; локально кэш выключен (в `wrangler dev` страницы рендерятся каждый раз). Без кэша сайт работает так же, только без экономии.
- Панель: обычные HTML-формы с POST на ту же страницу (работают без JS), после успеха 303 и сообщение через короткую cookie (повторная отправка при обновлении страницы не записывает закупку дважды). React-острова: поле фото (уменьшение в браузере) и формы животного и проекта (`client:load`). 2FA (настройка и ввод кода) — серверные формы, ключ показывается через `<details>`.
- Сессии Supabase: `@supabase/ssr` в `src/middleware.ts` для `/volunteer`, `/login`, `/auth`; без входа → `/login`, без `aal2` → `/volunteer/2fa` или `/2fa/verify` (303 вместо 307). Формы защищены проверкой `Origin` (`security.checkOrigin`).
- Доступность: уникальные `title` (проверяется тестом), ошибки форм `role="alert"`, итоги действий `role="status"`, `aria-label` у повторяющихся ссылок и кнопок («Подробнее: Барсик», «Сохранить статус: Рекс»), внешние ссылки в новой вкладке с пометкой для скринридера, `X-Robots-Tag: noindex, nofollow` и `<meta name="robots" content="noindex">` в панели, пока `ALLOW_INDEXING≠true`.
- Переменные: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SITE_URL`, `CRON_SECRET`, `DEEPL_API_KEY`, `ALLOW_INDEXING`. Все объявлены в `astro:env` как `access: "secret"`, поэтому читаются только во время работы; сборке переменные не нужны.
- Мелкие отличия в вёрстке: Tailwind без произвольных значений (`border-[1.2px]` → `border`, `w-[calc(50%-0.5rem)]` → `w-1/2` и т.п.); карточки животных на главной теперь `h3` под `h2` раздела.

Проверки (локальный Supabase с данными, перенесёнными этапом 1; `astro build` + `wrangler dev`):

```
$ npx astro check
Result (141 files): - 20 errors   ← все в scripts/ (старые импорты), исправлены на этапе 5
$ npx tsc --noEmit -p .            ← src/ без ошибок, ошибки только scripts/ (этап 5)
$ npx eslint .                     ← без замечаний
$ npx playwright test e2e/public.spec.ts --project=desktop
  ✓ ru: pages pass axe and have unique titles
  ✓ ro: pages pass axe and have unique titles
  ✓ en: pages pass axe and have unique titles
  ✓ site is not indexed while ALLOW_INDEXING is off
  ✓ external links open in a new tab and say so
  ✓ repeated links and buttons have distinct accessible names
  ✓ old addresses with the shelter slug redirect permanently
  ✓ mobile menu opens, closes with Escape and returns focus
  8 passed
$ npx playwright test e2e/panel.spec.ts --project=desktop
  ✓ wrong password and wrong code are refused with an alert
  ✓ a volunteer without a second factor sets one up     (первый прогон; дальше пропускается: фактор уже есть)
  ✓ a volunteer adds and edits an animal with a photo
  ✓ a volunteer records a purchase, undoes it and records consumption
  ✓ a volunteer adds a project with a photo and completes it
  ✓ the nightly translation needs the cron secret and reports DeepL
  ✓ logging out ends the session
$ npx playwright test e2e/panel.spec.ts -g axe --project=desktop --project=phone-375
  ✓ [desktop] panel pages pass axe and have unique titles
  ✓ [phone-375] panel pages pass axe and have unique titles
```

Вход в тестах — волонтёр, перенесённый из старой базы этапом 1, со старым паролем и старым секретом TOTP (данные передаются через `E2E_*`, в репозитории их нет).

Не проверено: настоящий перевод DeepL (нет ключа; проверено, что `/api/cron/translate` требует `CRON_SECRET` и отвечает полем `deepl`), Safari/iPhone (нет устройства), сброс кэша Cloudflare (только на хостинге).

## Этап 3. Фото и превью

Сделано как раньше: браузер готовит три файла (`src/lib/resizeImage.ts`: 1600 px, карточка 800 px, превью для ссылок 1200×630 JPEG до 200 КБ), сервер только проверяет заголовок файла, размер, формат и отсутствие EXIF/XMP (`src/lib/checkPhoto.ts`) и кладёт их в хранилище. Новые пути: `animals/<id>/photo.webp`, `animals/<id>/<uuid>.webp` при замене, `projects/<uuid>.webp`. `sharp` в коде сайта запрещён правилом ESLint.

```
$ npx playwright test e2e/photos.spec.ts --project=desktop
  ✓ the server accepts only photos prepared in the browser
    (отклонены: оригинал с EXIF, фото больше 1600, превью не JPEG, не картинка;
     принят подготовленный набор; форма с чужим Origin → 403)
$ npx playwright test e2e/panel.spec.ts -g "animal"
  ✓ … загружено через браузер: 1600 / 800 / 1200×630, без EXIF, og:image = -og.jpg
$ grep -rl '"sharp"' dist/server --include=*.mjs | wc -l
0
$ npx eslint src/lib/zz-sharp-probe.ts     # пробный файл с import sharp
  error  'sharp' import is restricted from being used …  no-restricted-imports
```

## Этап 4. Cloudflare

Сделано:

- `wrangler.jsonc`: `main: ./src/worker.ts` (свой вход: `fetch` из `@astrojs/cloudflare/handler` + `scheduled`), `nodejs_compat`, `keep_vars`, `observability`, расписания `0 2 * * *` и `0 14 * * *` как раньше. Адаптер сам дописывает в итоговый конфиг `assets` и `cache.enabled`; привязки KV для сессий и Images отключены (`session: false`, `imageService: "passthrough"`).
- Переменные только в Runtime variables (сборке не нужны), `ops/cloudflare/README.md` обновлён: команды сборки `npm run build` / `npx wrangler deploy`, новые имена переменных.
- `wrangler types` → `worker-configuration.d.ts` (типы `Env` и рантайма Workers).

Проверки:

```
$ npx wrangler dev --test-scheduled
$ curl "http://127.0.0.1:8788/cdn-cgi/handler/scheduled?cron=0+2+*+*+*"     → ok [200]
  0 2 * * * /api/cron/translate -> 200 {"shelters":0,"items":0,"projects":0,"pets":0,"cleared":0,"deepl":"DEEPL_API_KEY не задан"}
$ curl "http://127.0.0.1:8788/cdn-cgi/handler/scheduled?cron=0+14+*+*+*"    → ok [200]
  0 14 * * * /api/health -> 200 {"status":"ok"}
$ curl "http://127.0.0.1:8788/cdn-cgi/handler/scheduled?cron=5+5+*+*+*"     → exception [500]
  Uncaught Error: No job for schedule "5 5 * * *"
$ npx wrangler deploy --dry-run --outdir …
  Total Upload: 2181.25 KiB / gzip: 497.97 KiB      (Next/OpenNext: около 1,8 МиБ gzip)
```

Не проверено: выкладка на Cloudflare (нельзя трогать боевой Worker; для нового Worker нужен токен с правом записи), кэш Worker на хостинге.

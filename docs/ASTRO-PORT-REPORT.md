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

## Этап 5. Скрипты координатора

Сделано: удалены `move-projects.ts`, `move-volunteer.ts`, `delete-shelter.ts`; остальные работают с одной строкой `shelter` и таблицей `volunteers`, slug больше не указывается. **Все** скрипты без `--apply` только показывают план (раньше `invite-volunteer`, `reset-2fa`, `create-shelter`, `set-shelter-brand`, `upload-shelter-photo`, `load-gallery` и `add-*-copies` действовали сразу, а `load-needs` использовал `--dry`). Общий вход — `scripts/lib/connect.ts`. Описание перенесено из комментариев в `scripts/README.md`. Новые пути в хранилище: `brand/<uuid>/…`, `shelter/<uuid>.webp`.

Проверка на локальном Supabase (после переноса данных этапа 1):

```
$ node scripts/create-shelter.ts "Другой приют"
  Приют уже заведён: «Приют «Живи»». На сайте может быть только один приют.
$ node scripts/reset-2fa.ts vol2@example.org
  Будет удалено факторов входа у vol2@example.org: 1.
  Ничего не изменено. Чтобы применить, добавьте --apply.
$ node scripts/edit-project.ts "Ремонт" --title "Ремонт вольеров" --to-top
  название: «Ремонт» → «Ремонт вольеров» … Ничего не изменено. Чтобы применить, добавьте --apply.
$ node scripts/load-gallery.ts папка
  Фото: 1, папка сайта public/shelters/live-life/gallery. … Ничего не изменено.
(так же без --apply: invite-volunteer, create-project, load-needs, set-shelter-brand, upload-shelter-photo, add-card-copies, add-preview-copies)

$ node scripts/create-project.ts --title "Скрипт-проект" … --apply     → Создано.
$ node scripts/load-needs.ts needs.jsonl --apply                        → Создать: 1, обновить: 0. Готово.
$ node scripts/set-shelter-brand.ts icon.png --apply                    → Логотип и значки приюта обновлены: brand/37a3…; logo.png → 200
$ node scripts/upload-shelter-photo.ts 99.jpg "Двор приюта" --apply     → Фото приюта обновлено: shelter/8ba8….webp
$ node scripts/add-preview-copies.ts --apply                            → Превью созданы: 0, уже были: 35, ошибок: 0
$ node scripts/invite-volunteer.ts new-volunteer@example.org --apply    → ссылка /auth/confirm?token_hash=…&type=invite
$ curl <ссылка>                       → 303 /auth/set-password;  страница «Задайте пароль», «Приют «Живи»» → 200
$ npx tsc --noEmit -p .               → без ошибок (теперь и scripts/)
```

Не проверено с `--apply`: `load-gallery` (переписал бы файлы галереи в репозитории), `reset-2fa` (сброс проверен только как план), `edit-project --fix-translation` (нет переводов DeepL в тестовых данных).

## Этап 6. Резервные копии

Сделано:

- `backup.sh` и `restore-drill.sh` больше не перечисляют таблицы старой схемы: список берётся из самой копии (все таблицы `public` из `schema.sql`), поэтому один и тот же код копирует и проверяет и старый проект, и новый.
- Новые необязательные секреты: `BACKUP_REPOSITORY` и `BACKUP_REPOSITORY_TOKEN` (куда коммитить копии), `BACKUP_DIR` (подпапка), `PHOTO_BUCKET` (по умолчанию `pet-photos`). Проект Supabase уже задавался секретами `SUPABASE_DB_URL` и `SUPABASE_URL`.
- Workflow берут скрипты из репозитория копий (`tools/`), а копии кладут в `BACKUP_REPOSITORY` или в тот же репозиторий.
- Проба «аноним не может вставить строку» отправляет пустую строку (раньше — поле `slug`, которого в новой схеме нет, и PostgREST отвечал 400 до проверки прав).
- В `ops/backup/README.md` — раздел «Переход на новый проект `live-life`»: что сменить руками.

Проверка (локально):

```
$ BACKUP_DIR=backup-new ops/backup/backup.sh          # новая схема
Tables in the dump: auth.users, storage.objects and 8 of the site
Photos in storage: 113, new: 113, failed: 0
$ BACKUP_DIR=backup-new ops/backup/restore-drill.sh
PASS  the backup holds 8 tables of the site
PASS  auth.users: 3 of 3 rows
PASS  public.gallery_photos: 6 of 6 rows   … public.pets 34, pet_internal 13, projects 6, purchase_items 31, purchase_log 5, shelter 1, volunteers 3
PASS  sign-in passwords kept for 3 of 3 users
PASS  storage policies: 2 of 2 (volunteers can upload photos)
PASS  anonymous visitors have no write grants (0)
PASS  anonymous insert is refused (HTTP 401)
PASS  photos used by the site served byte for byte: 113 of 113
PASS  every pet photo opens (34 pets, 0 missing)
RESTORE DRILL PASSED
$ BACKUP_DIR=backup ops/backup/restore-drill.sh        # копия старой схемы (этап 1)
PASS  the backup holds 8 tables of the site
RESTORE DRILL PASSED
```

Первый прогон тревоги на новой схеме упал на пробе анонимной вставки (HTTP 400, см. выше); после исправления — `PASSED`.

Не проверено: запуск workflow на GitHub Actions (нет доступа к приватному репозиторию копий).


## Этап 7. Проверка

Все команды — на локальном Supabase и локальном `wrangler dev` (сборка `npm run build`). Данные: копия старой схемы, перенесённая `ops/migrate/migrate.sh` (этап 1), плюс записи, созданные тестами.

### Типы, линтер, база

```
$ npx tsc --noEmit -p .              → tsc: ok
$ npm run lint                       → без замечаний на момент проверки; позже добавленный ops/perf/measure-cpu.mjs дал 8 ошибок no-undef, исправлено в 1a1ec53 (см. «Повторная проверка»)
$ npx astro check                    → Result (144 files): 0 errors, 0 warnings, 1 hint
$ npx -y supabase@2.122.0 db reset --local && npx -y supabase@2.122.0 test db
All tests successful.
Files=32, Tests=543
Result: PASS                          (было 49 файлов / 499 проверок)
```

### Playwright и axe (desktop и 375 px)

```
$ E2E_EMAIL=… E2E_PASSWORD=… E2E_TOTP_SECRET=… E2E_NEW_EMAIL=… E2E_CRON_SECRET=… npx playwright test --trace off
  30 passed, 2 failed, 2 skipped
```

Два падения — проверка «у повторяющихся ссылок разные подписи»: тест фото на каждом прогоне добавлял животное с одной и той же кличкой, и в каталоге появились одинаковые «Подробнее: …». Две «Мурки» и в жизни дали бы одинаковые подписи (на Next так же), поэтому проверка изменена на «ссылка карточки называет именно своё животное», а тест фото даёт уникальные клички. После этого:

```
$ npx playwright test e2e/public.spec.ts --trace off
  16 passed            (ru/ro/en: axe WCAG 2.2 AA без нарушений, уникальные title, noindex, внешние ссылки, 301, меню)
$ npx playwright test e2e/panel.spec.ts e2e/photos.spec.ts  (в общем прогоне выше)
  вход, неверный пароль и код, настройка 2FA, животное с фото (создание, правка, статус),
  закупки (приёмка, отмена, расход), проект с фото и счётом дел, ночной перевод (401 без секрета, поле deepl),
  axe и уникальные title всех страниц панели, выход, проверка фото на сервере — passed
  skipped: настройка 2FA (у этого волонтёра фактор уже настроен первым прогоном)
```

Последние два коммита (предзагрузка шрифта, фон галереи из миниатюры) после этого проверены только публичными тестами (16 passed); тесты панели после них не перезапускались, потому что база была очищена для pgTAP.

### Адреса: старый → новый

Старый сайт — живой Next (только GET), новый — локальный Astro. «Итог» — куда приводит переход по ссылке.

| Старый адрес | Next (живой сайт) | Astro: ответ на старый адрес | Astro: итог |
|---|---|---|---|
| `/` | 307 /ru | 307 /ru | 200 /ru |
| `/ru` | 307 /ru/shelter/live-life | 200  | 200 /ru |
| `/ro` | 307 /ro/shelter/live-life | 200  | 200 /ro |
| `/en` | 307 /en/shelter/live-life | 200  | 200 /en |
| `/ru/` | 308 /ru | 301 /ru | 200 /ru |
| `/shelter/live-life` | 307 /ru/shelter/live-life | 301 /ru | 200 /ru |
| `/ru/shelter/live-life` | 200  | 301 /ru | 200 /ru |
| `/ro/shelter/live-life` | 200  | 301 /ro | 200 /ro |
| `/en/shelter/live-life` | 200  | 301 /en | 200 /en |
| `/ru/shelter/live-life/catalog` | 200  | 301 /ru/catalog | 200 /ru/catalog |
| `/ru/shelter/live-life/catalog?mode=treatment` | 200  | 301 /ru/catalog?mode=treatment | 200 /ru/catalog?mode=treatment |
| `/ro/shelter/live-life/catalog?species=dog&size=large` | 200  | 301 /ro/catalog?species=dog&size=large | 200 /ro/catalog?species=dog&size=large |
| `/en/shelter/live-life/catalog?mode=treatment&group=blocked` | 200  | 301 /en/catalog?mode=treatment&group=blocked | 200 /en/catalog?mode=treatment&group=blocked |
| `/ru/shelter/live-life/needs` | 200  | 301 /ru/needs | 200 /ru/needs |
| `/ru/shelter/live-life/needs?urgent=1` | 200  | 301 /ru/needs?urgent=1 | 200 /ru/needs?urgent=1 |
| `/ro/shelter/live-life/projects` | 200  | 301 /ro/projects | 200 /ro/projects |
| `/en/shelter/live-life/about` | 200  | 301 /en/about | 200 /en/about |
| `/ru/privacy` | 200  | 200  | 200 /ru/privacy |
| `/privacy` | 307 /ru/privacy | 307 /ru/privacy | 200 /ru/privacy |
| `/ru/shelter/other` | 404  | 404  | 404 /ru/shelter/other |
| `/ru/nothing` | 404  | 404  | 404 /ru/nothing |
| `/login` | 200  | 200  | 200 /login |
| `/volunteer` | 307 /login | 303 /login | 200 /login |
| `/volunteer/needs` | 307 /login | 303 /login | 200 /login |
| `/auth/set-password` | 307 /login | 303 /login | 200 /login |
| `/api/health` | 200  | 200  | 200 /api/health |
| `/api/cron/translate` | 401  | 401  | 401 /api/cron/translate |
| `/robots.txt` | 200  | 200  | 200 /robots.txt |
| `/sitemap.xml` | 200  | 200  | 200 /sitemap.xml |

Все старые адреса продолжают открываться: страницы приюта отвечают 301 на адрес без `/shelter/live-life` с теми же параметрами. Отличия: `/{язык}` теперь сама главная (200 вместо 307), `/{язык}/` → 301 вместо 308, вход в панель без сессии → 303 вместо 307.

### Процессорное время на запрос (локально, `ops/perf/measure-cpu.mjs`, 20 запросов)

Next — сборка OpenNext этой же ветки до переноса на тех же данных (старая схема), Astro — после переноса.

| Страница | Next, мс CPU | Astro, мс CPU |
|---|---|---|
| главная `/ru` | 52,1 | 21,9 |
| каталог | 48,9 | 17,0 |
| каталог, лечение | 43,5 | 14,6 |
| страница животного | 41,6 | 17,1 |
| нужды | 47,4 | 13,4 |
| проекты | 36,3 | 9,9 |
| о приюте | 39,2 | 13,3 |
| главная `/ro` | 49,2 | 13,1 |
| каталог `/en` | 49,4 | 16,3 |
| политика | 24,6 | 7,4 |
| `/api/health` | 13,2 | 7,0 |
| `/login` | 22,8 | 5,9 |

В 2,5–4 раза меньше на каждой странице. **Но 10 мс по этому замеру укладываются только `/ru/projects`, `/ru/privacy`, `/api/health` и `/login`**; главная и каталог — 15–22 мс. Насколько локальные цифры совпадают с Cloudflare, не проверено: на живом Next метрики Cloudflare показывали 15–120 мс при локальных 37–52 мс, то есть на хостинге может быть иначе в обе стороны. Если публичные страницы будут отдаваться из кэша Worker (60 с, этап 2), большинство просмотров не будут тратить CPU вовсе — это тоже не проверено на хостинге.

### Lighthouse 13.6.0, 375×812, мобильный профиль (замедление по умолчанию)

| Страница | Next: perf / a11y / LCP, мс / вес, КиБ / JS, КиБ | Astro: perf / a11y / LCP, мс / вес, КиБ / JS, КиБ |
|---|---|---|
| главная | 89 / 100 / 3343 / 314 / 174 | 100 / 100 / 1527 / 85 / 0 |
| каталог | 90 / 100 / 3196 / 322 / 174 | 100 / 100 / 1752 / 90 / 0 |
| животное | 94 / 100 / 2944 / 314 / 174 | 100 / 100 / 1593 / 85 / 0 |
| нужды | 98 / 100 / 804 / 316 / 174 | 100 / 100 / 776 / 76 / 0 |
| проекты | 99 / 100 / 772 / 303 / 174 | 100 / 100 / 763 / 92 / 0 |
| о приюте | 90 / 100 / 3575 / 805 / 176 | 87 / 100 / 4008 / 580 / 0 → после 3fb3e63: 96–97 / 100 / 2610–2820 / 311 / 0 |

Best practices 100 везде; SEO 69 на обоих (страницы закрыты от индексации, пока `ALLOW_INDEXING=false`). «JS 0» — скрипт меню (≈1 КиБ) встроен в страницу, отдельных файлов JavaScript нет. Первый замер Astro дал на «Нуждах» сдвиг вёрстки 0,245 из-за подмены шрифта — исправлено предзагрузкой шрифта. «О приюте» осталась хуже Next (87 против 90): самое тяжёлое на странице — фото галереи, одинаковые на обоих сайтах; размытый фон теперь из миниатюры, но LCP — само фото.

## Итог

Сделано (ветка `astro`, коммиты не отправлены):

- схема одного приюта, RLS и 543 проверки pgTAP;
- перенос данных с паролями, 2FA и фото (`ops/migrate`), проверен на копии старой схемы;
- сайт на Astro с теми же страницами, языками и панелью; старые адреса — 301;
- фото готовит браузер, сервер проверяет, `sharp` в сайте запрещён;
- Cloudflare: `wrangler.jsonc`, расписания 02:00 и 14:00, поле `deepl`, переменные только в Runtime;
- скрипты координатора под один приют, по умолчанию только показывают;
- резервные копии работают со старой и новой схемой, проект и репозиторий — в секретах.

Не проверено (нет доступа или устройства):

- выкладка на Cloudflare и поведение кэша Worker на хостинге; процессорное время на хостинге;
- новый проект Supabase `live-life` (нет ключей) — всё проверено на локальном Supabase;
- перенос из настоящей копии боевого проекта;
- перевод DeepL на самом деле (нет ключа);
- workflow копий на GitHub Actions;
- Safari/iPhone (загрузка фото).

Что остаётся вам:

1. Решить, вливать ли ветку `astro`. Она меняет схему базы: выкладывать её можно только вместе с новым проектом Supabase, на старую базу этот код не работает.
2. Создать проект Supabase `live-life`, применить миграцию из ветки (`supabase db push` к **новому** проекту), проверить, что TOTP включён.
3. Пробный и настоящий перенос: `ops/migrate/README.md` (сначала без `--apply`).
4. В Cloudflare: Runtime variables с новыми именами (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SITE_URL`, `CRON_SECRET`, `DEEPL_API_KEY`, `ALLOW_INDEXING`), в Builds — только `NODE_VERSION`; команды сборки и выкладки — `ops/cloudflare/README.md`. В Supabase → URL Configuration — адрес сайта.
5. `.env.coordinator`: `SUPABASE_URL` и ключ нового проекта (slug в командах скриптов больше не нужен).
6. Резервные копии: секреты `SUPABASE_DB_URL`, `SUPABASE_URL` нового проекта и новые файлы — `ops/backup/README.md`, раздел «Переход».
7. После выкладки посмотреть CPU time в Worker → Metrics: если главная и каталог всё ещё выше 10 мс, Workers Paid остаётся нужен.
8. Волонтёрам: войти заново (сессии не переносятся), пароль и приложение-аутентификатор прежние.


## Повторная проверка (после коммитов 33974b5 … 08b0ab6)

### Playwright, все спецификации, desktop и phone-375

База очищалась для pgTAP, поэтому данные заново перенесены той же командой (`ops/migrate/migrate.sh … --apply` → `MIGRATION CHECK PASSED`), TOTP локально включён в `supabase/config.toml` (не закоммичено).

```
$ npx playwright test --trace off          # HEAD 33974b5, до правок
  33 passed, 1 skipped, 0 failed
  skipped: [phone-375] a volunteer without a second factor sets one up
           (на desktop этот тест прошёл и настроил фактор, второй прогон его пропускает)

$ npx playwright test --trace off          # после 3fb3e63 и 08b0ab6
  34 passed, 2 skipped, 0 failed
  skipped: настройка 2FA на обоих профилях (фактор уже настроен первым прогоном)
```

Упавших проверок нет.

### «О приюте»: первое фото (LCP)

Причина: в рамку шириной 343 px на телефоне грузилась фотография галереи 1200 px (`01.webp`, 457 КиБ). Сделано: копии галереи 480 и 800 px (`NN-480.webp`, `NN-800.webp`), у главного фото `srcset` и `sizes`, переключение фото в галерее меняет и `srcset`; `scripts/load-gallery.ts` теперь сам делает эти копии. Для текущей галереи копии сделаны из файлов 1200 px (исходников в репозитории нет), качество как у `load-gallery` (WebP 72). Телефон 375 px (плотность 2) получает `01-800.webp`, 188 КиБ.

Lighthouse 13.6.0, 375×812, мобильный профиль, по 3 прогона:

| | perf | LCP, мс | вес страницы, КиБ | фото LCP |
|---|---|---|---|---|
| до (33974b5) | 86 / 87 / 87 | 4083 / 4084 / 4008 | 580 | `01.webp`, 457 КиБ |
| после (3fb3e63) | 97 / 96 / 96 | 2610 / 2820 / 2738 | 311 | `01-800.webp`, 188 КиБ |
| Next (для сравнения, 1 прогон) | 90 | 3575 | 805 | |

```
$ npx playwright test e2e/public.spec.ts -g gallery
  ✓ gallery serves a smaller photo to phones and switches photos   (desktop и phone-375)
$ npx tsc --noEmit -p . && npm run lint      → без ошибок
```


## Проверка по пяти приоритетам (13.11.2026)

Всё — на ветке `astro`, локально: Supabase в Docker, Astro в `wrangler dev`. Next — ветка `main` (`dbd372a`) в отдельной папке (`git worktree`) со своим локальным Supabase старой схемы. Данные у обоих сайтов одинаковые: одна и та же копия старой схемы, для Astro перенесённая `ops/migrate/migrate.sh --apply` (`MIGRATION CHECK PASSED`, 17 сверок PASS).

### 1. Дизайн Astro и Next

Скриншоты Playwright (Chromium, полная страница, анимации выключены): 375×812 и 1280×900; публичные страницы на ru/ro/en (главная, каталог, каталог «лечение», животное, нужды, проекты, о приюте, политика, 404), вход и 12 страниц панели. Всего 80 пар, плюс 6 пар состояний: открытое меню на телефоне, открытый выбор языка, ввод кода 2FA, настройка 2FA. Сравнение попиксельное (порог 30 из 765 по сумме каналов).

До исправлений: на телефоне каждая публичная страница Astro была на 32–66 px короче, «Политика» — на 1400 px длиннее; разница 4–43 % пикселей.

Найденные отличия и исправления (каждое — отдельный коммит):

| Отличие | Причина | Коммит |
|---|---|---|
| Подвал: у кнопок связи, пояснения про Viber и почты меньше отступы | лишняя обёртка `<div>` | b5907f0 |
| Десктоп: меню в шапке в две строки | колонки шапки были 3 равные трети вместо `1fr auto 1fr` | 7c7921c |
| Главная: у верхнего блока резкий нижний край фона | не было второго градиента, растворяющего фон | d036c84 |
| Животное: блок «Другие питомцы» на 24 px выше, другие отступы | блок вынесен из основной колонки | 2a1cd36 |
| «Политика» с шапкой и подвалом приюта | в Next страница без них | 06d8e05 |
| Вход и «Задайте пароль»: пустая полоса шапки панели | в Next шапки нет | e3ef5a5 |
| Срочные нужды: рамка 2 px вместо 1,5 px | замена произвольного значения | 21679e9 |
| Код 2FA: цифры реже разнесены (0,1em вместо 0,3em) | то же | 6f2dbfd |
| Панель: кнопки «Редактировать» 16 px вместо 15 px, кличка 24 px вместо 26 px | то же | b9c636e |
| Панель: формы и заголовки на 8 px шире | `w-1/2` вместо «половина минус промежуток» | 9061960 |
| «О приюте»: рамка текущей миниатюры другого цвета | `#D2691E` заменён на цвет акцента | f1f470b |
| Меню на телефоне: высота «весь экран» вместо «экран минус шапка» | то же | d86fde4 |
| Правка животного: флажки лечения в рамках и мельче | общая форма для «нового» и «правки» | 779cf14 |

Произвольные значения Tailwind (`pt-[30px]`) по-прежнему не используются: нужные размеры заведены как именованные классы в `src/styles/global.css` (`grid-cols-header`, `bg-hero`, `bleed-accent-soft`, `border-urgent`, `w-half-gap`, `max-h-menu`, `text-control`, `text-pet-name`, `tracking-code`, цвет `gallery-current`).

После исправлений:

```
86 пар: 81 — разница 0,00 % (меньше 0,005 % пикселей), высоты страниц совпадают до пикселя
  phone  ru/ro/en-about   1,28–1,33 %   ← намеренно, см. ниже
  phone  v-home           0,05 %
  desktop v-home          0,04 %
```

Оставшиеся отличия, которые иначе нельзя или не нужно:

- «О приюте» на телефоне: главное фото галереи — копия 800 px вместо 1200 px (ускорение из 3fb3e63: 188 КиБ вместо 457 КиБ). Картинка та же, отличаются только пиксели пересжатия. На десктопе — 0,00 %.
- Список животных в панели: цифра в строке «Девочка, ≈11 лет» сдвинута на 1 px. React разбивает эту строку на несколько текстовых узлов, и кернинг на стыке чуть другой; Astro отдаёт одну строку. Глазом не видно.
- Рамки `border-[1.2px]` из Next оставлены как `border` (1 px): на экранах с плотностью 1, 2 и 3 браузер рисует их одинаково (тоже 1, 2 и 3 точки), разница возможна только на экранах с дробной плотностью.

Не сравнивалось: шаг настройки 2FA с QR-кодом (код каждый раз новый), страница «Задайте пароль» по приглашению, сообщения об ошибках и успехе в формах, страница 500, Safari и Firefox.

### 2. Скорость

Процессорное время на запрос (`ops/perf/measure-cpu.mjs`, 20 запросов, оба сайта в `workerd`: Next — сборка OpenNext из `main`, Astro — `npm run build`; замеры подряд на одной машине):

| Страница | Next, мс | Astro, мс | Во сколько раз меньше |
|---|---|---|---|
| главная | 74,4 | 17,9 | 4,2 |
| каталог | 65,3 | 16,5 | 4,0 |
| каталог, лечение | 50,9 | 13,1 | 3,9 |
| животное | 54,9 | 13,8 | 4,0 |
| нужды | 54,4 | 14,5 | 3,8 |
| проекты | 52,5 | 10,2 | 5,1 |
| о приюте | 49,8 | 15,2 | 3,3 |
| главная `/ro` | 72,4 | 16,6 | 4,4 |
| каталог `/en` | 62,4 | 17,7 | 3,5 |
| политика | 34,2 | 7,2 | 4,8 |
| `/api/health` | 14,2 | 9,1 | 1,6 |
| `/login` | 23,7 | 6,6 | 3,6 |

Цифры обоих сайтов выше, чем в прошлом замере (машина была нагружена двумя Supabase), соотношение то же. В лимит бесплатного тарифа (10 мс) по этому замеру укладываются только политика, `/api/health` и `/login`; остальные страницы — 10–18 мс. На Cloudflare цифры могут отличаться в обе стороны; кэш страниц на 60 с (этап 2) на хостинге не проверен.

Lighthouse 13.6.0, 375×812, мобильный профиль, по 3 прогона, медиана (perf / LCP, мс / вес страницы, КиБ / JavaScript, КиБ):

| Страница | Next | Astro |
|---|---|---|
| главная | 88 / 3022 / 313 / 174 | 100 / 1623 / 86 / 0 |
| каталог | 87 / 3333 / 324 / 174 | 100 / 1525 / 89 / 0 |
| животное | 94 / 2492 / 312 / 174 | 100 / 1474 / 85 / 0 |
| нужды | 99 / 810 / 313 / 174 | 100 / 784 / 76 / 0 |
| проекты | 98 / 798 / 303 / 174 | 100 / 792 / 79 / 0 |
| о приюте | 67 / 5660 / 804 / 176 | 96 / 2741 / 311 / 0 |
| политика | 97 / 790 / 278 / 165 | 100 / 772 / 70 / 0 |

Доступность 100 и Best practices 100 на всех страницах обоих сайтов; SEO 69/66 на обоих (индексация выключена, `ALLOW_INDEXING=false`). Next «о приюте» в трёх прогонах: 89, 67, 64.

### 3. Чистота кода

Сделано: удалены неиспользуемые `localePath`, `toContentLanguage`, `FormState` (f9e368b, 8011080); `.env.example` с новыми именами переменных (99c22db); README без Next/OpenNext/next-intl в описании стека, запуска и многоязычности (d8a2346); в `ops/backup/README.md` новые имена переменных (df26730); ESLint больше не упоминает папки `.next/` и `.open-next/` (e53e78a); скрипт замера CPU больше не зависает в конце (0e35ccf).

Проверено: неиспользуемых файлов нет; все зависимости `package.json` используются (`@astrojs/check` — для `astro check`, `react-dom` нужен `@astrojs/react`); в 96 файлах TypeScript комментариев нет (кроме `worker-configuration.d.ts`, который генерирует `wrangler types`); произвольных значений Tailwind нет.

```
$ npx tsc --noEmit -p .        → tsc: ok
$ npm run lint                 → без замечаний (exit 0)
$ npx astro check              → 0 errors, 0 warnings, 1 hint
$ npx playwright test --trace off
  36 passed, 2 skipped, 0 failed (1.7m)
  skipped: настройка 2FA на обоих профилях (фактор уже настроен первым прогоном;
           отдельно после сброса 2FA: 1 passed)
```

Осталось в README: разделы о бизнес-модели и боте описывают будущую схему с несколькими приютами (это план, не код).

### 4. Фото и бесплатный Supabase

Размеры — настоящим кодом приложения (`preparePhotos` из `src/lib/resizeImage.ts`, в Chromium) на 16 настоящих фото приюта из галереи (675–1200 px по длинной стороне; исходников с телефона нет):

```
среднее: основное 184 КБ, карточка 800 px 89 КБ, превью для ссылок 130 КБ (не больше 200 КБ по коду)
основное в пересчёте на 1600×1200 (как с телефона): 82–702 КБ, среднее 318 КБ
```

| | На 1 животное | 500 животных |
|---|---|---|
| основное фото 1600 px | ~318 КБ | ~159 МБ |
| карточка 800 px | ~89 КБ | ~45 МБ |
| превью для ссылок | ~130 КБ | ~65 МБ |
| **итого** | **~0,54 МБ** | **~0,27 ГБ** |

Проекты: одно фото ~318 КБ, 30 проектов ≈ 10 МБ. Галерея «О приюте» лежит в репозитории и отдаётся Cloudflare, в Supabase её нет. Значки и фото приюта — меньше 1 МБ. Всего около 0,28 ГБ.

Лимиты бесплатного тарифа Supabase: **страницу https://supabase.com/pricing открыть не удалось** — хост supabase.com закрыт сетевыми правилами этой рабочей среды (проверено 13.11.2026: `CONNECT tunnel failed, response 403`, `getaddrinfo ENOTFOUND supabase.com`). Поиск по сайту supabase.com 13.11.2026 даёт: хранилище файлов 1 ГБ; трафик 5 ГБ без кэша + 5 ГБ из кэша CDN в месяц; база 500 МБ; пауза проекта после недели без активности; не больше 2 бесплатных проектов. **Эти цифры не сверены с самой страницей тарифов**: их нужно проверить на https://supabase.com/pricing.

Вывод по месту: 500 животных ≈ 0,28 ГБ из 1 ГБ (около 28 %), если старые файлы не копятся.

Замена фото: **раньше старые файлы не удалялись ни в Next, ни в Astro** (при каждой замене оставались 3 лишних файла животного или 1 файл проекта). У волонтёра нет права удалять файлы (так задумано: украденный вход не может стереть фото). Исправлено (d876a7c): после успешного сохранения сервер удаляет старые файлы служебным ключом, в фоне. Проверка (c395100): после замены фото животного старые основное фото, карточка и превью отвечают не 200, новые — 200; для проекта старое фото отвечает не 200. Тест прошёл на desktop и phone-375. Файлы, накопившиеся на старом сайте, этим не удаляются.

Запасной вариант для картинок: **раньше не было ни в Next, ни в Astro** (браузер показывал значок битой картинки). Сделано (278e524): если нет карточки 800 px, карточка в каталоге и в панели берёт основное фото; если нет и его, картинка скрывается, видна плашка фона, подпись (`alt`) остаётся для скринридера. Проверка (3eb37b4): при 404 на все `-card` карточка показывает основное фото; при 404 на всё хранилище у картинки `data-broken`, `opacity: 0`, `alt` на месте.

Трафик, если фото отдаются из хранилища Supabase напрямую (у файлов `Cache-Control` на год, повторный просмотр в том же браузере трафика не тратит):

| Просмотр | Фото | Трафик |
|---|---|---|
| каталог, первый экран (3 карточки сразу + ленивые рядом, ~6) | 6 × 89 КБ | ~0,53 МБ |
| каталог, долистать страницу до конца (24 карточки) | 24 × 89 КБ | ~2,1 МБ |
| страница животного (фото + 4 карточки «Другие питомцы») | 318 + 4 × 89 КБ | ~0,67 МБ |

На 5 ГБ без кэша в месяц: ~9 400 первых экранов каталога или ~2 400 полностью пролистанных страниц каталога, или ~7 500 страниц животных. Сюда же идёт трафик ответов базы. Если считается и кэш CDN (ещё 5 ГБ), примерно вдвое больше.

Что можно сделать, чтобы не упереться (не сделано, решать вам):

1. Карточкам на телефоне отдавать копию 480 px вместо 800 px (как галерее): карточка ~35 КБ вместо 89 КБ, трафик каталога меньше примерно в 2,5 раза. Нужна ещё одна копия при загрузке и `srcset`.
2. Отдавать фото через Cloudflare: Cloudflare R2 (10 ГБ места бесплатно, трафик не тарифицируется) или свой домен с кэшем Cloudflare перед хранилищем. Это переезд хранилища, отдельная работа.
3. Следить за счётчиком: Supabase → Usage → Egress. Если трафик подходит к 5 ГБ — сначала пункт 1.

Резервные копии фото (`photos/` в репозитории копий) хранят и удалённые с сайта файлы и только растут; при 500 животных это ~0,3 ГБ плюс все замены. У GitHub есть рекомендуемый предел размера репозитория (около 1 ГБ, не проверено по странице GitHub).

### 5. Надёжность и копии

```
$ BACKUP_DIR=… ops/backup/backup.sh                 # новая схема, данные после всех тестов
Tables in the dump: auth.users, storage.objects and 8 of the site
Saved …/db/2026-11-13.tar.gz.gpg (40K)
Photos in storage: 125, new: 125, failed: 0
$ BACKUP_DIR=… STORAGE_VERSION=v1.84.19 ops/backup/restore-drill.sh
PASS  the backup holds 8 tables of the site
PASS  auth.users: 2 of 2 rows
PASS  public.gallery_photos: 6 of 6 rows   … pets 38, pet_internal 14, projects 7, purchase_items 31, purchase_log 5, shelter 1, volunteers 2
PASS  sign-in passwords kept for 2 of 2 users
PASS  storage policies: 2 of 2 (volunteers can upload photos)
PASS  anonymous visitors have no write grants (0)
PASS  anonymous insert is refused (HTTP 401)
PASS  photos used by the site served byte for byte: 125 of 125
PASS  storage holds only the used photos (125; photos/ keeps 125, including deleted ones)
PASS  every pet photo opens (38 pets, 0 missing)
RESTORE DRILL PASSED
```

(Учебная тревога поднимает свой Supabase на стандартных портах, поэтому локально основной Supabase на это время останавливался. На GitHub Actions она идёт одна.)

Ночное удаление старых копий. Как было: удаляются файлы `db/ГГГГ-ММ-ДД.tar.gz.gpg` с датой в имени строго раньше «сегодня минус `KEEP_DAYS`» (60), и только после того, как новая копия записана (при любой ошибке до этого скрипт останавливается). Сегодняшняя копия удалиться не может. Слабые места, проверенные на деле:

- `KEEP_DAYS=-5` → скрипт молча удалил 3 из 4 старых копий (оставил последние 5 дней); нечисловое значение остановило бы скрипт до копирования фото;
- если копии не делались больше 60 дней, после возобновления в папке осталась бы одна сегодняшняя копия.

Исправлено (d124076): `KEEP_DAYS` — целое число не меньше 7, иначе скрипт сразу останавливается; 7 самых новых копий не удаляются никогда.

```
1) 10 копий за июнь + новая сегодня → удалены 06-01…06-04, остались 06-05…06-10 и 11-13 (7 копий)
2) KEEP_DAYS=-5 → «KEEP_DAYS must be a whole number of days, at least 7», exit 1, ничего не тронуто
   KEEP_DAYS=abc → то же
3) копии за 90 дней подряд → удалено 30, осталось 61 (с 2026-09-14 по 2026-11-13)
```

Доступ волонтёра: **в Next и Astro не было способа вернуть доступ волонтёру, забывшему пароль** (приглашение для существующей почты Supabase отклоняет: «A user with this email address has already been registered»). Сделано: `scripts/reset-password.ts` (432357a) печатает одноразовую ссылку на «Задайте пароль»; `/auth/confirm` принимает такие ссылки (b1dabd8). Supabase не даёт сменить пароль без кода 2FA, если он включён, поэтому страница «Задайте пароль» в этом случае спрашивает и код (e758ec6). Проверка на локальном сайте:

```
vol1 (2FA есть): ссылка → /auth/set-password, поле кода: 1
  неверный код → «Код из приложения: Неверный код. Попробуйте ещё раз.», пароль не изменён
  верный код → /volunteer/needs; вход новым паролем → /volunteer/2fa/verify; старым → «Неверная почта или пароль.»
  (затем тем же способом возвращён прежний пароль)
vol2: reset-2fa --apply («Удалено факторов: 1») → reset-password --apply → поля кода нет → новый пароль сохранён
  → вход → /volunteer/2fa (настройка заново); тест «a volunteer without a second factor sets one up» — 1 passed
повторное открытие использованной ссылки → /login?error=invite
```

`docs/RUNBOOK.md` (c50ea9a): что делать, если сайт упал, пропали данные или фото, как восстановить из копии, как вернуть доступ волонтёру. Команды в нём проверены локально; действия в интерфейсах Cloudflare, Supabase и GitHub помечены «не проверено».

### Пробный перенос из настоящей копии боевой базы

Не выполнен: нужна настоящая ночная копия (приватный репозиторий копий) и пароль копий. Пароль должен быть внутри рабочей среды, а передавать его сюда нельзя. Шаги для запуска на компьютере владельца — в сообщении владельцу.

### Итог

| Приоритет | Вердикт | Числа | Что нужно от вас |
|---|---|---|---|
| 1. Дизайн как в Next | хорошо | 86 пар скриншотов: 81 совпадают (<0,005 %), 5 отличаются на 0,04–1,3 % по объяснимым причинам; 13 исправлений | ничего; по желанию посмотреть сайт на iPhone |
| 2. Скорость | есть риск | CPU в 3,3–5,1 раза меньше Next, но 10–18 мс на большинстве страниц при лимите 10 мс; Lighthouse 96–100 против 67–99 | после выкладки смотреть Worker → Metrics → CPU time; если выше 10 мс — Workers Paid ($5 в месяц) |
| 3. Чистота кода | хорошо | tsc, lint, astro check — 0 ошибок; Playwright 36 passed, 0 failed | ничего |
| 4. Фото и бесплатный Supabase | есть риск | 500 животных ≈ 0,28 ГБ из 1 ГБ; 5 ГБ трафика ≈ 2 400–9 400 просмотров каталога в месяц; старые фото теперь удаляются, у картинок есть запасной вариант | проверить лимиты на https://supabase.com/pricing (здесь страница закрыта); решить про карточки 480 px или хранилище на Cloudflare |
| 5. Надёжность и копии | хорошо (не проверено на настоящей копии) | учебная тревога: 17 PASS; удаление копий больше не может оставить меньше 7; восстановление доступа проверено | пробный перенос из настоящей копии — по шагам в сообщении; учебная тревога на GitHub после перехода |


## После проверки по пяти приоритетам (13.11.2026)

**Удаление старых фото.** Раньше код удалял старый файл при замене, не проверяя, нужен ли он кому-то ещё. Через панель так не бывает (у каждой загрузки свой адрес), но база этого не запрещает. Теперь перед удалением сервер проверяет животных, проекты и фото приюта; если файл ещё нужен или проверка не удалась, файл остаётся, в журнале — `old photo kept` (18f093b). Удаление идёт в фоне после сохранения, поэтому сбой удаления сохранение не ломает. Тесты `e2e/photo-cleanup.spec.ts` (2048cd2), desktop и phone-375:

```
✓ a replaced photo that another animal still uses is kept
✓ when deleting the old photo fails › the animal is still saved with the new photo
  (второй сервер с неверным служебным ключом; переменные E2E_SUPABASE_URL, E2E_SERVICE_ROLE_KEY, E2E_BROKEN_BASE_URL)
4 passed
```

**Кэш и заголовки.** Сброс кэша в коде уже был правильным: `Astro.cache.invalidate({ tags: ["public"] })` под проверкой `Astro.cache.enabled`. Ошибка `cache.purge is not a function` идёт изнутри адаптера `@astrojs/cloudflare` 14.4.7 и только в локальном `wrangler dev`; в типах Workers `cache.purge` есть. На хостинге не проверено. Добавлено: у перехода по языку на `/` — `Cache-Control: no-store` и `Vary: Accept-Language` (573830a); у панели, входа, `/auth` и `/api` — `Cache-Control: no-store` (f089161; раньше `no-store` был только для CDN Cloudflare). «Политика» не предрисована: она берёт из базы название приюта, значки и признак публикации. Тест `e2e/cache-headers.spec.ts` (d17cb30): 6 passed.

```
$ npx playwright test --trace off   → 44 passed, 4 skipped, 0 failed
$ npm run lint → exit 0;  npx tsc --noEmit → ok;  npx astro check → 0 errors
```

**Просмотр у владельца.** `scripts/seed-local.ts` (8265431) заполняет пустую локальную базу тестовыми данными и отказывается работать с нелокальной базой. Проверено повторением шагов владельца в отдельной папке: 16 фото галереи, 12 животных, 10 нужд, 3 проекта, волонтёр; повторный запуск и адрес `*.supabase.co` отклоняются; `npm run preview` → все публичные страницы 200, вход волонтёра ведёт на настройку 2FA. У владельца (Ubuntu) сайт открылся, публичные страницы просмотрены; вход в панель ещё не подтверждён.

**Документы** обновлены: `docs/STATUS.md` (где остановились, решения, порядок шагов), `ops/cloudflare/README.md` (на боевом Worker ещё команды сборки OpenNext — поменять при вливании; сборки веток выключены; проверки кэша), `ops/backup/README.md` (правило 7 копий, вопрос роста репозитория), `ops/migrate/README.md` (порты 55320–55329 заняты локальной базой просмотра).

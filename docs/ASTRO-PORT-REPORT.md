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

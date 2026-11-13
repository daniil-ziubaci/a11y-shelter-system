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

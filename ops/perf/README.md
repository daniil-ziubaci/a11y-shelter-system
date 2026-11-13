# Замер процессорного времени локально

`measure-cpu.mjs` подключается к инспектору `wrangler dev` (тот же протокол, что у Chrome DevTools), включает профилировщик V8 и считает время всех не-холостых сэмплов за N одинаковых запросов, делённое на N. Это оценка процессорного времени Worker на запрос в локальном `workerd`, а не цифра Cloudflare: машина другая, профилировщик добавляет накладные расходы. Для сравнения двух версий сайта на одних данных она годится; для проверки лимита 10 мс на хостинге смотрите Worker → Metrics → CPU time или `wrangler tail`.

```bash
npm run build
npx wrangler dev --port 8788 --inspector-port 9230
node ops/perf/measure-cpu.mjs http://127.0.0.1:8788 http://127.0.0.1:9230 20 /ru /ru/catalog /ru/needs
```

const { chromium } = require("playwright");
const sharp = require(process.cwd() + "/node_modules/sharp");
const cases = [
  ["desktop", { width: 1280, height: 900 }, "/ru/shelter/live-life/catalog", null],
  ["desktop-p2-dogs", { width: 1280, height: 900 }, "/ru/shelter/live-life/catalog?species=dog&size=large&page=2", null],
  ["desktop-treatment", { width: 1280, height: 900 }, "/ru/shelter/live-life/catalog?mode=treatment", null],
  ["desktop-ro", { width: 1280, height: 900 }, "/ro/shelter/live-life/catalog?q=Ba", null],
  ["mobile", { width: 390, height: 844 }, "/ru/shelter/live-life/catalog", null],
  ["mobile-menu", { width: 390, height: 844 }, "/ru/shelter/live-life/catalog", "menu"],
  ["desktop-lang", { width: 1280, height: 900 }, "/en/shelter/live-life/catalog", "lang"],
];
(async () => {
  const browser = await chromium.launch();
  for (const [name, vp, path, action] of cases) {
    const shots = [];
    for (const port of [8787, 8788]) {
      const page = await browser.newPage({ viewport: vp });
      await page.goto(`http://127.0.0.1:${port}${path}`, { waitUntil: "networkidle" });
      for (let y = 0; y < 40; y++) { await page.mouse.wheel(0, 600); await page.waitForTimeout(60); } await page.evaluate(async () => { window.scrollTo(0, 0); await Promise.all([...document.images].map((i) => i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; }))); await document.fonts.ready; });
      await page.waitForLoadState("networkidle"); await page.waitForTimeout(500);
      if (action === "menu") { await page.locator("button:visible", { hasText: /Меню/ }).click(); await page.waitForTimeout(300); }
      if (action === "lang") { await page.locator("summary:visible").click(); await page.waitForTimeout(300); }
      const file = `${process.env.S}/${name}-${port === 8787 ? "next" : "astro"}.png`;
      await page.screenshot({ path: file, fullPage: !action });
      shots.push(file); await page.close();
    }
    const [a, b] = await Promise.all(shots.map((f) => sharp(f).raw().toBuffer({ resolveWithObject: true })));
    let diff = 0; const n = Math.min(a.data.length, b.data.length);
    for (let i = 0; i < n; i += a.info.channels) if (Math.abs(a.data[i] - b.data[i]) + Math.abs(a.data[i+1] - b.data[i+1]) + Math.abs(a.data[i+2] - b.data[i+2]) > 30) diff++;
    console.log(`${name.padEnd(18)} next ${a.info.width}x${a.info.height}  astro ${b.info.width}x${b.info.height}  отличающихся пикселей: ${diff} (${(diff / (n / a.info.channels) * 100).toFixed(3)}%)`);
  }
  await browser.close();
})();

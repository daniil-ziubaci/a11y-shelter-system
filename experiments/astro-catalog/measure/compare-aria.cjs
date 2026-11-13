const { chromium } = require("playwright");
const paths = ["/ru/shelter/live-life/catalog", "/ru/shelter/live-life/catalog?species=dog&size=large&page=2", "/ru/shelter/live-life/catalog?mode=treatment&group=blocked", "/en/shelter/live-life/catalog?q=zzz", "/ru/shelter/live-life/catalog?page=99"];
(async () => {
  const browser = await chromium.launch();
  for (const vp of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) for (const p of paths) {
    const out = [];
    for (const port of [8787, 8788]) {
      const page = await browser.newPage({ viewport: vp });
      const resp = await page.goto(`http://127.0.0.1:${port}${p}`);
      out.push({ snap: await page.locator("body").ariaSnapshot(), title: await page.title(), url: page.url().replace(/:\d+/, ""), status: resp.status() });
      await page.close();
    }
    const same = out[0].snap.replace(/\n- alert$/, "") === out[1].snap && out[0].title === out[1].title && out[0].url === out[1].url;
    console.log(`${vp.width}px ${p.padEnd(60)} ${same ? "совпадает" : "РАЗЛИЧИЕ"} (${out[0].snap.split("\n").length} строк, итоговый адрес ${out[1].url.replace("http://127.0.0.1", "")})`);
    if (!same) { require("fs").writeFileSync(process.env.S + "/aria-next.txt", out[0].snap); require("fs").writeFileSync(process.env.S + "/aria-astro.txt", out[1].snap); console.log(out.map(o => o.title + " " + o.url)); }
  }
  await browser.close();
})();

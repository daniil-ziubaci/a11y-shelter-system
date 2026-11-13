import fs from "node:fs";
import { execSync } from "node:child_process";
const [port, n] = [process.argv[2], Number(process.argv[3] ?? 200)];
const tick = Number(execSync("getconf CLK_TCK").toString());
const pids = execSync(`ps -eo pid,args | grep workerd | grep -v grep | grep -- '--socket-addr=entry=127.0.0.1:${port}\\|entry=127.0.0.1:0' || true`).toString().trim().split("\n").map((l) => l.trim().split(" ")[0]);
// keep only workerd processes whose parent tree belongs to this wrangler (match by sibling with the port)
const all = execSync("ps -eo pid,ppid,args").toString().split("\n").filter((l) => l.includes("workerd serve"));
const main = all.find((l) => l.includes(`entry=127.0.0.1:${port}`)); const ppid = main.trim().split(/\s+/)[1];
const mine = all.filter((l) => l.trim().split(/\s+/)[1] === ppid).map((l) => l.trim().split(/\s+/)[0]);
const cpu = () => mine.reduce((s, p) => { const f = fs.readFileSync(`/proc/${p}/stat`, "utf8").split(") ")[1].split(" "); return s + Number(f[11]) + Number(f[12]); }, 0) / tick * 1000;
const urls = ["/ru/shelter/live-life/catalog", "/ru/shelter/live-life/catalog?page=2", "/ro/shelter/live-life/catalog?species=dog", "/en/shelter/live-life/catalog?species=dog&size=large", "/ru/shelter/live-life/catalog?sex=female&age=adult", "/ru/shelter/live-life/catalog?mode=treatment", "/ru/shelter/live-life/catalog?q=%D0%91%D0%B0", "/ru/shelter/live-life/catalog?page=7"];
const first = urls[0];
let c0 = cpu(), t0 = Date.now();
let r = await fetch(`http://127.0.0.1:${port}${first}`); await r.text();
const firstCpu = cpu() - c0, firstMs = Date.now() - t0;
c0 = cpu(); t0 = Date.now(); let bytes = 0;
for (let i = 0; i < n; i++) { r = await fetch(`http://127.0.0.1:${port}${urls[i % urls.length]}`); if (r.status !== 200) throw new Error(r.status + urls[i % urls.length]); bytes += (await r.arrayBuffer()).byteLength; }
const dc = cpu() - c0, dt = Date.now() - t0;
console.log(JSON.stringify({ port, firstCpuMs: Math.round(firstCpu), firstMs, warmCpuMsPerReq: +(dc / n).toFixed(1), warmMsPerReq: +(dt / n).toFixed(1), avgKB: Math.round(bytes / n / 1024) }));

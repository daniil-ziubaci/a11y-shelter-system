const [base, inspector, runsArg, ...paths] = process.argv.slice(2);
const runs = Number(runsArg);

const targets = await (await fetch(`${inspector}/json`)).json();
const target = targets.find((t) => t.webSocketDebuggerUrl);
const ws = new WebSocket(target.webSocketDebuggerUrl, { headers: { Origin: "https://devtools.devprod.cloudflare.dev" } });
await new Promise((resolve, reject) => {
  ws.onopen = resolve;
  ws.onerror = reject;
});
let nextId = 1;
const pending = new Map();
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    pending.get(message.id)(message);
    pending.delete(message.id);
  }
};
function send(method, params = {}) {
  const id = nextId++;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve) => pending.set(id, resolve));
}

await send("Profiler.enable");
await send("Profiler.setSamplingInterval", { interval: 50 });

function cpuMs(profile) {
  const idle = new Set(profile.nodes.filter((n) => n.callFrame.functionName === "(idle)").map((n) => n.id));
  let micros = 0;
  profile.samples.forEach((node, i) => {
    if (!idle.has(node)) micros += profile.timeDeltas[i] ?? 0;
  });
  return micros / 1000;
}

for (const path of paths) {
  await fetch(base + path, { redirect: "manual" }).then((r) => r.arrayBuffer());
  await send("Profiler.start");
  const statuses = new Set();
  const started = performance.now();
  for (let i = 0; i < runs; i += 1) {
    const response = await fetch(base + path, { redirect: "manual" });
    await response.arrayBuffer();
    statuses.add(response.status);
  }
  const wall = (performance.now() - started) / runs;
  const { result } = await send("Profiler.stop");
  console.log(
    `${(cpuMs(result.profile) / runs).toFixed(1).padStart(6)} ms CPU  ${wall.toFixed(0).padStart(4)} ms wall  ${[...statuses].join(",")}  ${path}`,
  );
}
ws.close();
process.exit(0);

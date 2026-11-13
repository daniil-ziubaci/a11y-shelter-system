import { handle } from "@astrojs/cloudflare/handler";

const JOBS: Record<string, string> = {
  "0 2 * * *": "/api/cron/translate",
  "0 14 * * *": "/api/health",
};

export default {
  fetch: handle,

  async scheduled(controller, env, ctx) {
    const path = JOBS[controller.cron];
    if (!path) {
      throw new Error(`No job for schedule "${controller.cron}"`);
    }
    const headers = new Headers();
    if (path.startsWith("/api/cron/") && env.CRON_SECRET) {
      headers.set("authorization", `Bearer ${env.CRON_SECRET}`);
    }
    const response = await handle(
      new Request(new URL(path, "https://scheduled.invalid"), { headers }),
      env,
      ctx,
    );
    const body = (await response.text()).slice(0, 500);
    console.log(`${controller.cron} ${path} -> ${response.status} ${body}`);
    if (!response.ok) {
      throw new Error(`${path} answered ${response.status}`);
    }
  },
} satisfies ExportedHandler<Env>;

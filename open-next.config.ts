import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Every page is rendered on request (no ISR), so no incremental cache
// (R2 or KV) is needed. Images are served as stored: next.config.ts sets
// images.unoptimized, so no Cloudflare Images binding either.
export default defineCloudflareConfig();

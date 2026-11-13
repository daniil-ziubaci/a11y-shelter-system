import cloudflare from "@astrojs/cloudflare";
import { cacheCloudflare } from "@astrojs/cloudflare/cache";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, envField } from "astro/config";

const runtimeVariable = (optional = false) =>
  envField.string({ context: "server", access: "secret", optional });

export default defineConfig({
  output: "server",
  adapter: cloudflare({ imageService: "passthrough" }),
  integrations: [react()],
  session: false,
  trailingSlash: "never",
  i18n: {
    locales: ["ru", "ro", "en"],
    defaultLocale: "ru",
    routing: "manual",
  },
  cache: { provider: cacheCloudflare() },
  security: { checkOrigin: true },
  env: {
    schema: {
      SUPABASE_URL: runtimeVariable(),
      SUPABASE_ANON_KEY: runtimeVariable(),
      SUPABASE_SERVICE_ROLE_KEY: runtimeVariable(true),
      SITE_URL: runtimeVariable(),
      CRON_SECRET: runtimeVariable(true),
      DEEPL_API_KEY: runtimeVariable(true),
      ALLOW_INDEXING: runtimeVariable(true),
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});

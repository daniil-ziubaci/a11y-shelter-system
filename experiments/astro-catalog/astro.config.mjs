import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  output: "server",
  adapter: cloudflare({ imageService: "passthrough" }),
  build: { inlineStylesheets: "never" },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: { "@": fileURLToPath(new URL("../..", import.meta.url)) },
    },
  },
});

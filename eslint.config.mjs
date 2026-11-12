import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // The site runs on Cloudflare Workers, where native modules cannot load.
    // Photos are prepared in the browser (lib/resizeImage.ts); sharp is only
    // for coordinator scripts that run on a computer.
    files: ["app/**", "components/**", "lib/**", "i18n/**", "proxy.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "sharp",
              message:
                "sharp does not run on Cloudflare Workers. Prepare images in the browser (lib/resizeImage.ts) or in scripts/.",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Cloudflare build output and wrangler state.
    ".open-next/**",
    ".wrangler/**",
  ]),
]);

export default eslintConfig;

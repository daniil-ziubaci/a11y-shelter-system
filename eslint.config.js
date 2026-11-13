import js from "@eslint/js";
import astro from "eslint-plugin-astro";
import jsxA11y from "eslint-plugin-jsx-a11y-x";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [".next/", ".open-next/", "dist/", ".astro/", ".wrangler/", "node_modules/", "worker-configuration.d.ts", "src/lib/database.ts", "scripts/data/", "public/", "test-results/", "playwright-report/"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs["flat/recommended"],
  ...astro.configs["flat/jsx-a11y-recommended"],
  {
    files: ["**/*.tsx"],
    plugins: { "jsx-a11y-x": jsxA11y },
    rules: jsxA11y.configs.recommended.rules,
  },
  {
    files: ["src/**"],
    rules: {
      "astro/jsx-a11y/no-redundant-roles": ["error", { ul: ["list"] }],
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "sharp",
              message: "sharp does not run on Cloudflare Workers. Photos are prepared in the browser (src/lib/resizeImage.ts).",
            },
          ],
        },
      ],
    },
  },
);

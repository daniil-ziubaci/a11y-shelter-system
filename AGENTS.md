## Stack

The site is Astro 7 (`output: "server"`) on Cloudflare Workers via `@astrojs/cloudflare`, with React only for the volunteer panel islands in `src/islands/`. Check APIs against the installed packages in `node_modules/` (types and sources): Astro 7, the Cloudflare adapter and Supabase change between versions.

- Runtime variables are read through `astro:env/server` and are all declared `access: "secret"`, so they are read at run time, never inlined at build.
- The database has ONE shelter (`public.shelter`, one row); there is no `shelter_id` anywhere.
- No comments in `.ts` and `.tsx` files; Tailwind classes only from the scale (no `pt-[30px]`); imports with `@/`.

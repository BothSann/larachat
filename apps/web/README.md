# LaraChat web

TanStack Start app for LaraChat. Setup and the full stack: see the [root README](../../README.md).

| Command | Does |
|---|---|
| `pnpm dev` | Website on http://localhost:3000 |
| `pnpm check` | Biome, `tsc --noEmit`, Vitest |
| `pnpm build` | Production build |

Copy `.env.example` to `.env`. Only `VITE_*` variables reach the browser, so never put secrets there.

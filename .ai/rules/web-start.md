# Web rules: TanStack Start (apps/web)

General patterns: `tanstack-start-practices`. This file holds the project's choices and wins on conflicts.

## Before writing code
- Check installed versions in `apps/web/package.json` and use those APIs. TanStack moves fast; read current docs, not memory.
- The owner runs `pnpm add`, generators, and `pnpm dlx shadcn add`.

## Data path
- The **browser talks to Laravel directly** through `src/lib/api-client.ts` (see [web-data.md](web-data.md)). Sanctum SPA cookie auth is built for this: `localhost:3000` and `localhost:8000` are the same site.
- **No `createServerFn` that only forwards a call to Laravel.** The Start server has no user cookies, and proxying would make Laravel see one IP for every user (breaks the per-IP `login` limiter).
- Server functions are for work that must stay on the server (a secret, a server-only SDK). None in v1. When one appears: `.validator()` with Zod, file `*.functions.ts`, server-only helpers in `*.server.ts`.
- No `src/start.ts` until something needs it. If one is added, `createCsrfMiddleware()` is listed first.

## SSR
| Route | `ssr` | Why |
|---|---|---|
| `/` (landing), not-found | `true` (default) | Public, no user needed |
| `_guest` layout and children | `false` | Guard must see the login cookie, which only the browser has |
| `_app` layout and children | `false` | Same, plus Echo and browser-only state |

Set `ssr: false` on the layout route; children inherit it.

## Env
- Only `VITE_*` reaches the browser: `VITE_API_URL`, `VITE_REVERB_APP_KEY`, `VITE_REVERB_HOST`, `VITE_REVERB_PORT`, `VITE_REVERB_SCHEME`.
- Never put a secret in `VITE_*`.

## Style
- TypeScript `strict: true`. No `any`.
- Biome for lint and format. `pnpm check` must pass.

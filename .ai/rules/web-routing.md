# Web rules: routing (apps/web)

General patterns: `tanstack-router-practices`, auth flow in `tanstack-integration-practices`. This file wins on conflicts.

## Files
- File-based routes in `src/routes/`. `src/routeTree.gen.ts` is generated; never edit it.
- Route files stay thin: `validateSearch`, `beforeLoad`/`loader`, one page component. Feature code lives in `src/features/<feature>/`.

## Layouts
| Folder | URL examples | Guard in `beforeLoad` |
|---|---|---|
| `src/routes/_guest/` | `/login`, `/register`, later `/forgot-password`, `/reset-password` | Logged in → `redirect` to `search.redirect` or `/chats` |
| `src/routes/_app/` | `/chats`, `/chats/$conversationId` | Logged out (`ApiError` 401) → `redirect` to `/login?redirect=<current href>` |

- Both guards read the user with `context.queryClient.ensureQueryData(meQuery)` (see [web-data.md](web-data.md)). Never call `fetch` in a guard.
- Guards are UX only. Laravel's `auth:sanctum` and Policies are the real security.
- Both layouts use `ssr: false` ([web-start.md](web-start.md)).

## Search params
- Every search param is validated with a Zod schema in `validateSearch`.
- `redirect` accepts only a same-app path: starts with `/`, not `//`. Anything else falls back to `/chats` (stops open-redirect tricks).

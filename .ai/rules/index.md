# Rules index

Open the files whose globs cover the paths you touch. Then `grep -rin '<keyword>' .ai/rules` to catch what a path match misses.

| Globs | Read |
|---|---|
| `**` (branches, commits, PRs) | [git.md](git.md) |
| `apps/api/**` | [api-laravel.md](api-laravel.md) |
| `apps/api/routes/api.php`, `apps/api/app/Http/**`, `docs/plan.md` | [api-endpoints.md](api-endpoints.md) |
| `apps/api/app/Events/**`, `apps/api/routes/channels.php`, `apps/api/config/reverb.php` | [api-realtime.md](api-realtime.md) |
| `apps/api/tests/**` | [api-testing.md](api-testing.md) |
| `apps/web/**` | [web-start.md](web-start.md) |
| `apps/web/src/routes/**`, `apps/web/src/router.tsx` | [web-routing.md](web-routing.md) |
| `apps/web/src/lib/api-client.ts`, `apps/web/src/lib/api/**`, `apps/web/src/features/*/queries.ts`, `apps/web/src/features/*/mutations.ts` | [web-data.md](web-data.md) |
| `apps/web/src/components/**`, `apps/web/src/features/*/components/**`, `apps/web/src/features/*/schemas.ts`, `apps/web/src/styles.css` | [web-ui.md](web-ui.md) |
| `apps/web/src/lib/echo.ts`, `apps/web/src/features/*/realtime.ts` | [web-realtime.md](web-realtime.md) |
| `apps/web/**/*.test.ts`, `apps/web/**/*.test.tsx`, `apps/web/src/test/**` | [web-testing.md](web-testing.md) |
| `learn/**` with `kind: web` | [web-learning.md](web-learning.md) |

Rule files hold this project's decisions only. General know-how lives in the skills they point to:
- API: Laravel Boost guidelines (`apps/api/CLAUDE.md`), then `laravel-api-practices`.
- Web: `tanstack-start-practices`, `tanstack-router-practices`, `tanstack-query-practices`, `tanstack-integration-practices`, then the official TanStack docs.

Project rules win over skills.

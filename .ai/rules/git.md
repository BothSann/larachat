# Git rules

Branch model: [.github/gitflow.md](../../.github/gitflow.md). Tooling: `/to-issue` and `/to-pr` skills.

## Flow per slice
1. `/to-issue` → issue + branch name, e.g. `feature/12-send-message`.
2. Branch from `origin/next`.
3. Work in small commits.
4. Both gates pass for the apps you touched.
5. `/to-pr` → rebase on `next`, run checks, push, open PR into `next`.

## Commits
Format: `type(scope): description` — lowercase verb, no trailing period, no emoji.

Types: `feat`, `fix`, `refactor`, `perf`, `chore`, `style`, `build`, `ci`, `docs`, `test`.

Scopes:
| Scope | For |
|---|---|
| `api` | `apps/api` |
| `web` | `apps/web` |
| `realtime` | Events, channels, Echo, Reverb (either app) |
| `docs` | `docs/`, `README.md`, `.ai/rules/`, `CLAUDE.md` |
| `infra` | CI, tooling config, deploy files |

Examples: `feat(api): add send message endpoint`, `feat(web): show typing indicator`.

## Checks before push
| Changed | Run |
|---|---|
| `apps/api` | `cd apps/api && composer check` |
| `apps/web` | `cd apps/web && pnpm check` |
| API contract | `php artisan scribe:generate` + `pnpm gen:api`, commit both |

## Never
- Commit `.env`, keys, or `learn/`.
- Force-push `main`, `next`, or `release/*`.
- Merge the base into a branch. Rebase instead.

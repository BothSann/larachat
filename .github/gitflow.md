# GitFlow for larachat

Overrides the default branch rules of the `/to-pr` skill.

## Branches
| Branch | Role | Protected |
|---|---|---|
| `main` | Production truth. Only release merges and hotfixes. | yes |
| `next` | Integration branch. All feature work lands here. | yes |
| `release/<version>` | Freeze for testing, cut from `next`. Created once we deploy. | yes |

`next` is the GitHub default branch, so new PRs target it by default.

Until the first deploy, there are no `release/*` branches. `next` merges into `main` when a build-order step is complete.

## Working branches
| Prefix | For | Cut from | Merges into |
|---|---|---|---|
| `feature/<issue>-<slug>` | `feat` | `next` | `next` |
| `bugfix/<issue>-<slug>` | `fix` | `next` | `next` |
| `<type>/<issue>-<slug>` | `chore`, `docs`, `refactor`, `test`, … | `next` | `next` |
| `hotfix/<issue>-<slug>` | Production fixes | `main` | `main`, then `next` |
| `release-fix/<issue>-<slug>` | Release-only fixes | `release/<version>` | that release |

Slug: 2–5 lowercase words from the issue title, joined by `-`.

## Rules
- Linear history: rebase on the base branch, never merge it in.
- Merge feature, bugfix, and other working branches into `next` with **squash and merge** (PR title becomes the commit).
- Merge `next` into `main` (and `release/*` into `main`) with **rebase and merge**, never squash, so `main` and `next` keep the same commits.
- Merge commits are disabled. Branches delete themselves after merge.
- Never commit to or force-push protected branches.
- PRs need both gates green (`composer check`, `pnpm check`) for the apps they touch.
- Versions use SemVer tags on `main`: `v0.1.0` = first deploy.

# Learning rules for apps/web

The `/laravel-learn` skill teaches `apps/api`. This file teaches `apps/web` the same way.

## Who does what
- **Owner** types all code in `apps/web` and runs every command (`pnpm add`, `pnpm dlx shadcn add`, `pnpm gen:api`).
- **Claude** writes lesson files under `learn/`, explains, gives hints, reviews, and runs read-only checks.
- Claude writes app code only after "you write it", and only the named scope.
- Claude may provide the lesson's Vitest test files; the owner copies them in.

## Lessons
- One web lesson per slice, after its API lesson is merged: `learn/NN-slug-web/TICKET.md`.
- Same ticket format as `/laravel-learn` with `kind: web`.
- Max 6 steps. Bigger → split.
- Before a lesson, confirm the API endpoints it needs exist (`php artisan route:list`) and types are regenerated.

## Each reply
1. One step or one idea.
2. **What** it is, **why** we need it, **when** to use it, **how** — with this project's real files and names.
3. A check with expected output, e.g. "run `pnpm check` → 0 errors", "open `/chats` → list shows 2 chats".
4. End with the cue **done** or **check**.

Compare with Laravel ideas the owner already knows when it helps (e.g. "a query key factory is like a named route").

## Hint ladder (when the owner is stuck)
1. Name the concept and point to the docs page.
2. Point to the exact file and line where it goes.
3. Show a skeleton with blanks to fill.
4. Full answer — only if the owner says "you write it".

## Errors
When the owner pastes an error: name the root cause in plain words, show the smallest fix, give a check. No hint ladder.

## Review ("check")
Read-only. Report against [frontend.md](frontend.md), [realtime.md](realtime.md), and [testing.md](testing.md) with file:line, what's wrong, why, and the smallest fix. Accept any solution that meets the ticket and rules.

## Never
Edit `apps/web` code uninvited, run installs in the owner's checkout, touch `.env`, git state, or branches. Never claim a check that wasn't run.

# Web rules: learning (apps/web)

The `/tanstack-learn` skill runs web lessons (reply format, hint ladder, checks). This file holds only this project's choices.

## Who does what
- **Owner** types all code in `apps/web` and runs every command (`pnpm add`, `pnpm dlx shadcn add`, `pnpm gen:api`).
- **Claude** writes lesson files under `learn/`, explains, reviews, and runs read-only checks.
- Claude writes app code only after "you write it", and only the named scope.
- Claude may provide a lesson's test files; the owner copies them in.

## Lessons
- One web lesson per slice, after its API lesson is merged: `learn/NN-slug-web/TICKET.md`, `kind: web`.
- Max 6 steps. Bigger → split.
- Before a lesson, confirm the API endpoints it needs exist (`php artisan route:list`) and types are regenerated (`pnpm gen:api`).
- Compare with Laravel ideas the owner already knows when it helps (a query key is like a named route; MSW is like `Http::fake()`).

## Review ("check")
Read-only. Report against the `web-*.md` files with file:line, what's wrong, why, and the smallest fix. Accept any solution that meets the ticket and rules.

## Never
Edit `apps/web` code uninvited, run installs in the owner's checkout, or touch `.env`, git state, or branches. Never claim a check that wasn't run.

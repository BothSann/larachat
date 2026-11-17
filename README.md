# larachat

A simple real-time chat app. You can send direct messages and talk in small groups, see who is online, and see when someone is typing. Messages arrive instantly, without refreshing the page.

It is also a **learning project**: the owner types every line of app code, and Claude teaches, reviews, and checks. See [CLAUDE.md](CLAUDE.md).

## Stack

| Part | Tech | Job |
|---|---|---|
| `apps/api` | Laravel (latest stable), Sanctum, Reverb, Scribe | JSON API at `/api/v1`, login, WebSocket server |
| `apps/web` | TanStack Start, Router, Query, Tailwind v4, shadcn/ui, `@laravel/echo-react` | The website people use |
| Database | PostgreSQL 18 | Users, chats, messages |
| Redis 8 | | Cache, queues, sessions, Reverb scaling |
| Mailpit | | Catches emails locally (verification, password reset) |

Exact versions live in `apps/api/composer.lock` and `apps/web/pnpm-lock.yaml`. Check those files rather than trusting numbers in docs.

## Repository layout

```
larachat/
├── apps/
│   ├── api/            Laravel API (has its own Boost-owned CLAUDE.md)
│   └── web/            TanStack Start app
├── docs/
│   ├── requirements.md What we build, what we don't, scale targets
│   ├── plan.md         Endpoint tables + build order
│   └── architecture.md How requests and live messages flow
├── .ai/rules/          Coding rules for humans and AI tools
├── .github/gitflow.md  Branch model
├── learn/              Lesson files (git-ignored)
├── compose.yaml        Postgres, Redis, Mailpit (added in the scaffold lesson)
└── CLAUDE.md
```

## Requirements on your machine

- PHP 8.5+ and Composer
- Node (current LTS or newer) and pnpm
- Docker (for Postgres, Redis, Mailpit)

## Setup

These steps work once the scaffold lesson (build step 1) is finished.

```bash
git clone <repo-url> larachat && cd larachat
docker compose up -d                         # Postgres, Redis, Mailpit

cd apps/api
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate

cd ../web
cp .env.example .env
pnpm install
```

## Run it

Two terminals:

```bash
# Terminal 1 — API, queue worker, Reverb
cd apps/api && composer dev

# Terminal 2 — website
cd apps/web && pnpm dev
```

| Service | URL |
|---|---|
| Website | http://localhost:3000 |
| API | http://localhost:8000/api/v1 |
| API docs (Scribe) | http://localhost:8000/docs |
| Reverb (WebSocket) | ws://localhost:8080 |
| Mailpit inbox | http://localhost:8025 |
| Telescope (local only) | http://localhost:8000/telescope |

Both apps run on `localhost`, so the Sanctum login cookie works for both. Cookies ignore ports.

## Quality checks

```bash
cd apps/api && composer check   # Pint, Larastan (level 8), Pest
cd apps/web && pnpm check       # Biome, tsc, Vitest
```

Both must pass before a pull request is opened.

## Regenerate frontend API types

After an API change:

```bash
cd apps/api && php artisan scribe:generate
cd apps/web && pnpm gen:api     # openapi-typescript → src/lib/api/schema.d.ts
```

## Workflow

GitFlow: `main` (production) ← `next` (integration) ← `feature/<issue>-<slug>`.
Open issues with `/to-issue`, ship with `/to-pr`. See [.github/gitflow.md](.github/gitflow.md).

## Docs

- [Requirements](docs/requirements.md)
- [Plan and build order](docs/plan.md)
- [Architecture](docs/architecture.md)
- [Rules](.ai/rules/)

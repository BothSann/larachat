# API rules: Laravel (apps/api)

Also follow Laravel Boost guidelines in `apps/api/CLAUDE.md` and the `laravel-api-practices` skill. This file wins on conflicts.

## Before writing code
- Check the installed version: `composer show <package>`. Use APIs from that version.
- Look at sibling files and copy their structure and naming.
- Generate files with `php artisan make:*` (the owner runs these).

## Structure
- Standard Laravel folders. No modules until there are more than 3 feature areas.
- **Controllers are thin**: get validated input, authorize, call one Action, return a Resource. No queries, no business rules.
- **Actions** live in `app/Actions/<Area>/<Verb><Noun>.php`, are `final`, have one public `handle()` method, and get dependencies through the constructor.
- **Form Requests** validate and expose `toDto()` returning a readonly class from `app/Data`.
- **Policies** decide who may do what. Every route that touches a conversation goes through `ConversationPolicy`.
- **Enums** for fixed sets: `ConversationType`, `ParticipantRole`. Cast them on models.
- **Domain exceptions** in `app/Exceptions` render their own JSON with a stable `code` (see api-endpoints.md).
- Interfaces only when there is a real second implementation. Don't create them "just in case".

## PHP style
- `declare(strict_types=1);` at the top of every PHP file.
- Typed properties, parameters, and return types everywhere.
- `final` classes by default; `readonly` for DTOs and value objects.
- Constructor property promotion.
- Pint (Laravel preset) formats; Larastan level 8 must pass.

## Models and database
- ULID primary keys: `$table->ulid('id')->primary()`, `foreignUlid()`, `HasUlids` trait.
- `conversation_participants` may use a normal `id()` because its ID never leaves the app.
- Every foreign key is constrained and indexed. Add indexes that match real queries (`messages (conversation_id, id)`).
- `Model::shouldBeStrict()` outside production (catches lazy loading, missing attributes, silent mass assignment).
- `$fillable` on every model. Never `$guarded = []`.
- Never edit a migration that has run. Add a new one.
- Usernames stored lowercase; compare lowercase.
- Times in UTC (`app.timezone = UTC`).

## Writes
- Multi-row writes run in `DB::transaction()`.
- Events that broadcast are dispatched **after commit** (`ShouldDispatchAfterCommit` or `afterCommit()`).
- Creating a message uses `createOrFirst()` on the client ULID; reply 201 if new, 200 if it already existed.
- Never check-then-insert; let unique indexes settle races.

## Reads
- Eager load what the Resource uses (`with()` / `load()`); strict mode makes N+1 fail loudly.
- Unread count: count messages after `last_read_message_id` by others, capped (`limit 100`, show `99+`).
- Chat list ordered by `last_message_at desc, id desc`.

## Rate limits (in `AppServiceProvider`)
| Name | Limit |
|---|---|
| `login` | 5/min per email + IP |
| `verification-notification` | 6/min per user |
| `forgot-password` | 5/min per IP (the broker adds 1 email per address per 60s) |
| `messages` | 30/min per user |
| `search` | 60/min per user |
| `api` | 120/min per user/IP |

## Config and secrets
- All settings come from env through `config/*.php`. Code calls `config()`, never `env()`.
- No secrets in git. `.env.example` lists every key with a safe dummy value.
- Session, cache, and queue drivers are `redis`. No local-disk state.

## Observability
- Telescope enabled only in `local`.
- Pulse in production.
- Log channel `stack` with JSON formatter in production. Never log passwords, tokens, or message bodies.

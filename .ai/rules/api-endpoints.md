# API rules: endpoints

Based on the `laravel-api-practices` skill; project differences are marked **Override**.

## URLs
- Everything under `/api/v1`. Breaking change = new version prefix, never a silent change.
- Plural nouns: `/conversations`, `/conversations/{conversation}/messages`.
- Actions that aren't CRUD get a verb sub-path: `/read`, `/leave`.
- Route model binding by ULID.

## Responses
- Always an API Resource (`UserResource`, `ConversationResource`, `MessageResource`). Never return a model or array directly.
- Relations only with `whenLoaded()`; counts with `whenCounted()`.
- Dates are passed as Carbon and serialize to ISO-8601 UTC. Never format dates on the server.
- Never expose `password`, `remember_token`, `direct_key`, `email` of other users.

## Status codes
| Case | Code |
|---|---|
| Read OK | 200 |
| Created | 201 |
| Already existed (idempotent repeat, existing DM) | 200 |
| Accepted, work queued (emails) | 202 |
| Done, nothing to return (logout, read, leave, remove) | 204 |
| Not logged in | 401 |
| Logged in but not allowed / email not verified | 403 |
| Not found (or not visible to you) | 404 |
| Business rule broken (e.g. group full) | 409 or 422 with `code` |
| Validation failed | 422 |
| Rate limited | 429 |

Never send an error with status 200.

## Error shape
Laravel's own shape, nothing else:
```json
{ "message": "The body field is required.", "errors": { "body": ["The body field is required."] } }
{ "message": "This group is full.", "code": "group_full" }
```
Domain exceptions render this shape themselves. Never leak SQL, traces, or exception text.

Known codes: `group_full`, `cannot_message_self`, `cannot_remove_owner`, `email_not_verified`, `not_a_group`.

## Lists
- Every list is paginated. Cursor pagination (`cursorPaginate`) for messages, chats, and user search. Default 30, max 100.
- Sort and filter only on allow-listed fields.

## Writes
- Input goes FormRequest → DTO → Action.
- **Override (idempotency):** messages use the client-generated ULID `id` as their idempotency key instead of an `Idempotency-Key` header. Same id again → 200 with the stored message, even if the body differs.

## Auth
- **Override:** v1 uses Sanctum **SPA cookie** auth (`statefulApi()`), not tokens. The `auth-sanctum-tokens` rule applies only when tokens are added (mobile app).
- Routes use `auth:sanctum`; most also `verified`.
- Authorization is always a Policy, even when the ID is unguessable.

## Docs (Scribe)
- Every endpoint has a Scribe group, a short description, and example responses for success and each refusal.
- After an API change: `php artisan scribe:generate`, then `pnpm gen:api` in `apps/web`, and commit both outputs.

# Testing rules

A feature is done when its tests prove every acceptance criterion, including every refusal.

## API (Pest)
- Feature tests per endpoint in `tests/Feature/Api/V1/<Area>/<Action>Test.php`.
- Each endpoint tests: happy path, validation (422), not logged in (401), not allowed (403/404), rate limit where set (429), idempotent repeat where relevant.
- Assert status **and** JSON shape (`assertJsonPath`, `assertExactJsonStructure` for resources).
- Assert database state (`assertDatabaseHas`, counts) after writes.
- Broadcasting: `Event::fake([MessageSent::class])` then assert dispatched with the right channel and payload.
- Unit tests only for logic with no HTTP (e.g. ownership hand-over in `LeaveConversation`).
- Factories for every model, with states (`unverified()`, `group()`, `owner()`).
- Use `RefreshDatabase`. The test database is `larachat_test` (Postgres), set in `phpunit.xml`, never the dev database.
- No real network: `Mail::fake()`, `Notification::fake()`, `Queue::fake()` where needed.
- Gate: `composer check` (Pint `--test`, Larastan level 8, `php artisan test`).

## Web (Vitest)
- Test files next to the code: `foo.ts` → `foo.test.ts`.
- Test pure logic (api-client error mapping, cache update helpers, link detection, typing timeout) and key hooks.
- Components with Testing Library: test what the user sees and does, not internals.
- Mock the network at the `api-client` boundary (or MSW). Never call the real API.
- Gate: `pnpm check` (Biome, `tsc --noEmit`, `vitest run`).

## Later
Playwright end-to-end tests (two browsers chatting) are on the "later" list.

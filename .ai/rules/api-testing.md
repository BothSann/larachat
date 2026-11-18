# API rules: testing (Pest)

A feature is done when its tests prove every acceptance criterion, including every refusal.

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

Web tests: [web-testing.md](web-testing.md).

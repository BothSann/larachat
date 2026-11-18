# Web rules: testing (Vitest)

A feature is done when its tests prove every acceptance criterion, including every refusal.

- Vitest + Testing Library + MSW.
- Test files sit next to the code: `foo.ts` → `foo.test.ts`.
- Test pure logic (api-client error mapping, cache update helpers, link detection, typing timeout) and key hooks.
- Components: test what the user sees and does, not internals.
- Network is faked with MSW handlers (like `Http::fake()` in Pest). Never call the real API. Shared MSW setup lives in `src/test/`.
- Forms test the 422 path: the API's field error shows next to the right input.
- Gate: `pnpm check` (Biome, `tsc --noEmit`, `vitest run`).

## Later
Playwright end-to-end tests (two browsers chatting), after chat works.

API tests: [api-testing.md](api-testing.md).

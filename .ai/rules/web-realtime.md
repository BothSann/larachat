# Web rules: realtime (Echo)

Server side: [api-realtime.md](api-realtime.md).

## Principle
The database is the truth. Reverb is only the fast way to say "something changed". A lost WebSocket message must never mean a lost chat message.

## Echo
- One Echo instance in `src/lib/echo.ts`, using `@laravel/echo-react` hooks (`useEcho`, `useEchoPresence`). It only runs in the browser (`_app` is `ssr: false`).
- `api-client.ts` sends Echo's socket ID as `X-Socket-ID`.
- Channel auth goes to `/broadcasting/auth` with the same session cookie. Add `broadcasting/auth` to `paths` in `apps/api/config/cors.php` when realtime lands.
- Subscribe in the chat route; leave the channel when the route unmounts.

## Cache updates
- On `message.sent`: if the ID is already in the cache, ignore; else insert in order by ID (`setQueryData`).
- On `conversation.updated`: update the chat list entry with `setQueryData`.
- On reconnect and on tab becoming visible: invalidate the open chat's messages and the chat list.

## Typing (whispers)
- Send `whisper('typing', { userId })` on the presence channel, at most once every 2 s while typing.
- Hide the indicator after 3 s with no new whisper, or on `message.sent` from that user.

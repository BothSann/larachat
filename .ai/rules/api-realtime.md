# API rules: realtime (Reverb)

Browser side: [web-realtime.md](web-realtime.md).

## Principle
The database is the truth. Reverb is only the fast way to say "something changed". A lost WebSocket message must never mean a lost chat message.

## Events
- Live events implement `ShouldBroadcast` (queued). Never `ShouldBroadcastNow` in request code.
- Dispatched **after the database commit**.
- `broadcastAs()` returns a short dotted name: `message.sent`, `conversation.updated`, `conversation.removed`.
- `broadcastWith()` returns the same shape as the matching API Resource, so the frontend uses one type.
- Payload stays small (well under Reverb's message size limit). Send IDs + the one changed thing, not whole lists.
- Use `->toOthers()` / `InteractsWithSockets` so the sender's own tab isn't sent its message back.
- Broadcast jobs go on the `broadcasts` queue.

## Channels (routes/channels.php)
| Name | Kind | Rule |
|---|---|---|
| `conversation.{conversation}` | private | user is a participant |
| `conversation.{conversation}` | presence | user is a participant; return `['id', 'name', 'username']` only |
| `online` | presence | user is verified; return `['id', 'name', 'username']` only |
| `user.{id}` | private | `$user->id === $id` |

- Channel checks reuse the Policy (`$user->can('view', $conversation)`). No duplicated logic.
- Never broadcast on public channels.
- Broadcasting auth route uses the same Sanctum cookie session.

## Whispers
- Typing whispers never touch Laravel or the database.
- The Reverb app must allow client events.

## Scaling
- `REVERB_SCALING_ENABLED=true` when there is more than one Reverb server (Redis pub/sub).
- Raise the open-file limit on Reverb servers (each socket is a file handle).
- Keep queue workers for `broadcasts` separate so a slow job can't delay live delivery.

## Testing
- Feature tests use `Event::fake()` and assert the event, its channel, and its payload.
- Channel authorization has tests: participant allowed, outsider refused.

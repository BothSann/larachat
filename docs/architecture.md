# Architecture

## 1. The big picture

```
                 ┌──────────────────────────┐
  Browser ──────▶│ apps/web  TanStack Start │  :3000  pages, SSR for public pages
     │           └──────────────────────────┘
     │ fetch (cookie + X-XSRF-TOKEN)
     ▼
┌──────────────────────────┐      ┌───────────┐
│ apps/api  Laravel        │─────▶│ Postgres  │  users, chats, messages
│  /api/v1, /broadcasting  │      └───────────┘
└──────────┬───────────────┘
           │ push job            ┌───────────┐
           └────────────────────▶│  Redis    │  sessions, cache, queues, Reverb pub/sub
                                 └─────┬─────┘
                  queue worker ◀───────┘
                       │ broadcast
                       ▼
                 ┌───────────┐
  Browser ◀═════▶│  Reverb   │  :8081  WebSocket (kept open)
   (Echo)        └───────────┘
```

Two apps, one source of truth. The website never touches the database. It asks the API, and listens to Reverb for live updates.

## 2. Login (Sanctum SPA cookie)

1. Web calls `GET /sanctum/csrf-cookie` → browser gets an `XSRF-TOKEN` cookie.
2. Web calls `POST /api/v1/auth/login` with the token copied into the `X-XSRF-TOKEN` header.
3. Laravel starts a session (stored in Redis) and sets the session cookie.
4. Every later request sends the cookie automatically (`credentials: 'include'`).

Works because both apps share the parent domain (`localhost` locally; e.g. `larachat.app` + `api.larachat.app` in production). Key env: `SANCTUM_STATEFUL_DOMAINS`, `SESSION_DOMAIN`, `CORS supports_credentials=true`.

**Server rendering:** only public pages (landing, login, sign-up) are server-rendered. Chat routes use `ssr: false`, so the server never needs to forward the session cookie for private data.

## 3. Sending a message

```
Browser                    API                       Queue worker        Reverb         Others
  │ make ULID, show "sending"
  │── POST /messages {id,body} ─▶│
  │                             │ validate (FormRequest)
  │                             │ authorize (Policy)
  │                             │ SendMessage action, in a transaction:
  │                             │   createOrFirst(id) → message
  │                             │   conversation.last_message_at = now
  │                             │   sender's last_read_message_id = id
  │                             │ dispatch MessageSent + ConversationUpdated (after commit)
  │◀── 201 MessageResource ─────│
  │ mark "sent"                                      │── broadcast ─▶│── message.sent ─▶│
```

- **Idempotent:** the client's ULID is the primary key. A retry hits the unique key and `createOrFirst` returns the existing row → `200` instead of `201`.
- **Fast:** broadcasting runs on the queue, not in the request.
- **No echo to sender:** the web sends `X-Socket-ID`, the event uses `toOthers()`. The browser also ignores any message ID it already has.
- **Ordering:** ULIDs sort by time; the list is ordered by `id`.

## 4. Missed messages

WebSockets drop. On reconnect, or when a tab becomes visible again, the web app invalidates the open chat's query and the chat list. TanStack Query refetches the newest page. The database is the truth; Reverb is only the fast path.

## 5. Channels

| Channel | Type | Authorized when | Carries |
|---|---|---|---|
| `conversation.{id}` | private | user is a participant | `message.sent` |
| `user.{id}` | private | `$user->id === $id` | `conversation.updated`, `conversation.removed` |
| `conversation.{id}` | presence | user is a participant; returns `{id, name, username}` | who's online, `typing` whispers |

Typing is a **whisper** (client event): browser → Reverb → other browsers. Never stored, never hits Laravel. Requires client events enabled on the Reverb app.

## 6. Backend layers

```
Route → Controller (thin) → FormRequest (validate) → Policy (authorize)
      → Action (one business job, e.g. SendMessage)
      → Model / Eloquent
      → Event (ShouldBroadcast, queued)
      → API Resource (shape JSON)
```

| Folder | Holds |
|---|---|
| `app/Http/Controllers/Api/V1` | Thin controllers, one per resource |
| `app/Http/Requests` | Validation + `toDto()` |
| `app/Data` | Readonly DTOs passed into actions |
| `app/Actions/<Area>` | `SendMessage`, `StartDirectConversation`, `LeaveConversation` … |
| `app/Policies` | `ConversationPolicy`, `MessagePolicy` |
| `app/Events` | `MessageSent`, `ConversationUpdated`, `ConversationRemoved` |
| `app/Http/Resources` | `UserResource`, `ConversationResource`, `MessageResource` |
| `app/Enums` | `ConversationType`, `ParticipantRole` |
| `app/Exceptions` | Domain exceptions that render JSON with a `code` |
| `routes/channels.php` | Channel authorization |

**SOLID in practice**
- *Single responsibility:* one Action = one job; controllers only connect HTTP to actions.
- *Open/closed:* new behaviour = new Action or Listener, not edits to old ones.
- *Liskov / Interface segregation:* small interfaces only where a real second implementation exists (don't invent them).
- *Dependency inversion:* Actions receive dependencies through the constructor; the container wires them.

## 7. Frontend layers

```
apps/web/src/
  routes/                 file-based routes (TanStack Router)
    index.tsx             landing (SSR)
    login.tsx, register.tsx (SSR)
    _app.tsx              logged-in layout, ssr: false, auth guard
    _app/chats.tsx        chat list
    _app/chats.$id.tsx    one chat
  features/
    auth/      api.ts  hooks.ts  components/
    chats/     api.ts  hooks.ts  components/  query-keys.ts
    messages/  api.ts  hooks.ts  components/
  lib/
    api-client.ts         fetch wrapper: credentials, XSRF, JSON errors
    api/schema.d.ts       generated by openapi-typescript (never hand-edit)
    echo.ts               Echo + Reverb config
    query-client.ts
  components/ui/          shadcn/ui
```

Data flow: component → feature hook (`useMessages`) → TanStack Query → `api-client` → API. Live events update the Query cache, components re-render.

## 8. Scaling path

| Stage | Change |
|---|---|
| v1 | 1 API server, 1 queue worker, 1 Reverb, Postgres, Redis |
| More users | More API servers behind a load balancer (stateless, no sticky sessions) |
| More sockets | More Reverb servers, `REVERB_SCALING_ENABLED=true` (Redis pub/sub) |
| Busy queue | More workers; separate `broadcasts` queue from `default` |
| Busy database | Read replica for history/chat-list reads; later partition `messages` by time |

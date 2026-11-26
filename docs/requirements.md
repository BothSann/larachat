# Requirements

## 1. Goal

A small, fast chat app where signed-in people can message each other one-to-one or in groups, and see new messages instantly. It should be simple to use, and built so it can grow by adding servers instead of being rewritten.

## 2. Users and roles

| Who | Can |
|---|---|
| Visitor | See the landing page, sign up, log in, reset password |
| Member (verified user) | Everything below |
| Group owner | Rename the group, add/remove anyone, change roles |
| Group admin | Add/remove members (not the owner or other admins) |
| Group member | Read and send messages, leave |

Email must be verified before a user can start chats or send messages.

## 3. v1 features

### 3.1 Account
- Sign up with name, unique `@username`, email, password.
- Log in / log out (cookie session).
- Verify email, reset forgotten password.
- Edit own name and username.

`@username` rules: 3–30 chars, lowercase letters, numbers, `_`; unique ignoring case.

### 3.2 Finding people
- `/chats` lists every verified user except yourself under "People", by username, with a search field above it.
- Search users by username prefix (min 2 characters). Result excludes yourself. Search filters only "People".
- Choosing a person opens the direct conversation with them, or starts it.
- No friend requests. Any verified user can message any other verified user.

### 3.3 Direct conversations
- Start a direct conversation with any verified user. If one with that user already exists, open it instead (never two for the same pair). An unverified user is refused exactly like a user that does not exist.
- You cannot start a direct conversation with yourself.

### 3.4 Group chats
- Anyone verified can create a group with a name (1–80 chars) and at least one other member.
- Max **100** members.
- Roles: owner, admin, member. Owner can change roles.
- Anyone can leave. If the owner leaves, ownership moves to the oldest admin, else the oldest member. If the last person leaves, the group is deleted.

### 3.5 Messages
- Plain text, 1–4000 characters after trimming. No markdown. Links are shown clickable on the frontend.
- Shown instantly to the sender (optimistic), marked "sending" until the API confirms, "failed" with a retry button on error.
- Sending the same message twice (same client ULID) never creates a duplicate.
- History loads newest first, older messages load when you scroll up.
- Rate limit: 30 messages per minute per user.

### 3.6 Chat list
- On `/chats`, under "Chats", above "People": all your chats, newest activity first. A person can be in both lists.
- Each row: name (other person for direct conversations, group name for groups), last message preview, time, unread count (shown as `99+` above 99).
- Opening a chat marks it read.
- Updates live: new chats, new messages, and unread counts change without refresh.

### 3.7 Live presence
- Every verified user sees which verified users are online right now, on the "People" list and inside an open chat. Online and offline only: no "away", no "last seen".
- "X is typing…" shown while someone types; disappears after 3 seconds of silence or when they send.

## 4. Non-goals for v1 (the "later" list)

Read receipts ("seen by"), edit/delete message UI, file and image uploads, message search, push/email notifications for offline users, social login, blocking/reporting, reactions, threads, mobile app, Playwright end-to-end tests.

The schema leaves room for edit/delete (`edited_at`, soft deletes) and for tokens (Sanctum), so these can be added without breaking changes.

## 5. Non-functional requirements

| Area | Target |
|---|---|
| Scale (v1) | ~1,000 people online at once on one app server + one Reverb server |
| Scale (later) | ~100,000 online by adding servers, no rewrite. Exception: online status. It uses one channel for everyone, so every join and leave goes to every connected user. Chosen for a showcase app; it needs a new design at this size |
| Delivery | Message visible to other online participants in < 1 s (p95) |
| API speed | p95 < 200 ms for reads, < 300 ms for sends (excluding network) |
| History query | Cursor pagination, never `OFFSET`; constant speed regardless of chat length |
| Availability | Losing a WebSocket must not lose messages: reconnecting refetches what was missed |
| Security | Cookie auth with CSRF; every channel and endpoint checks participation; no sequential IDs in URLs |
| Privacy | A user only ever sees chats they are in |
| Time | Stored and sent in UTC (ISO-8601); browser shows local time |
| Accessibility | Keyboard usable, labelled inputs, readable contrast |
| Observability | Telescope locally; Pulse and JSON logs in production |
| Hosting | Not chosen yet; must stay hosting-neutral and Docker-ready |

## 6. Scalability principles

1. **Stateless app servers.** Nothing important lives in one server's memory or disk. Sessions, cache, queues are in Redis; files (later) go to object storage.
2. **Queue the slow stuff.** Broadcasting runs on a queue worker, so the send request returns fast.
3. **Reverb scales through Redis.** Several Reverb servers share messages using Redis pub/sub (`REVERB_SCALING_ENABLED=true`).
4. **Indexes match queries.** Every foreign key is indexed. Message history uses an index on `(conversation_id, id)`.
5. **Bounded work.** Every list is paginated, unread counts are capped, payloads are small.
6. **Denormalize the hot read.** `conversations.last_message_at` keeps the chat list sort cheap.

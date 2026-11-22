# Plan

Every API path is under `http://localhost:8000`. "Auth" values:
- `public` — no login needed
- `guest` — must be logged out
- `user` — logged in
- `verified` — logged in with verified email
- `participant` — verified and in that conversation (checked by a Policy)

All JSON responses follow [.ai/rules/api-endpoints.md](../.ai/rules/api-endpoints.md). Lists use cursor pagination.

## 1. Scaffold

No endpoints. Laravel API (`apps/api`) with Pest, Sanctum (SPA mode), Postgres, Redis, Boost, Pint, Larastan, Scribe, Telescope. TanStack Start app (`apps/web`) with Tailwind, shadcn/ui, Biome, Vitest. Local Postgres + Redis from Yerd, mail to Yerd's catcher. `composer check` and `pnpm check` scripts.

## 2. Account

| Method | Path | Auth | Does |
|---|---|---|---|
| GET | `/sanctum/csrf-cookie` | public | Sets the `XSRF-TOKEN` cookie |
| POST | `/api/v1/auth/register` | guest | Sign up, log in, send verification email → 201 user |
| POST | `/api/v1/auth/login` | guest | Log in → 200 user; 422 wrong details; 429 after 5 tries/min |
| POST | `/api/v1/auth/logout` | user | End session → 204 |
| GET | `/api/v1/me` | user | Current user → 200; 401 when logged out |
| PATCH | `/api/v1/me` | user | Change name / username → 200 |
| POST | `/api/v1/auth/email/verification-notification` | user | Resend email → 202; 409 `already_verified`; 429 after 6/min per user |
| GET | `/api/v1/auth/email/verify/{id}/{hash}` | public (signed URL) | Verify → 302 to `FRONTEND_URL/chats?verified=1` (also when already verified) |
| POST | `/api/v1/auth/forgot-password` | guest | Queue reset link email → 202 (same reply whether email exists or not); 429 after 5/min per IP |
| POST | `/api/v1/auth/reset-password` | guest | Set new password → 204 |
| PUT | `/api/v1/me/password` | user | Change password: body `{ current_password, password, password_confirmation }` → 204; 422 wrong current password |

Lessons (each API lesson is followed by its web lesson):
1. Register, login, logout, `GET /me` (with the login 429), plus `/sanctum/csrf-cookie`.
2. Email verification (resend + verify link) and `PATCH /me`.
3. Forgot and reset password.
4. Change password while logged in (`PUT /me/password`), after lesson 3.

## 3. People and direct chats

| Method | Path | Auth | Does |
|---|---|---|---|
| GET | `/api/v1/users?search=` | verified | Username prefix search, min 2 chars, excludes self → 200 cursor list |
| GET | `/api/v1/conversations` | verified | Your chats by `last_message_at` desc, with last message + unread count → 200 cursor list |
| POST | `/api/v1/conversations/direct` | verified | Body `{ user_id }` → 201 new DM, 200 existing DM, 422 self |
| GET | `/api/v1/conversations/{conversation}` | participant | One chat with participants → 200; 403 not a participant |

## 4. Messages

| Method | Path | Auth | Does |
|---|---|---|---|
| GET | `/api/v1/conversations/{conversation}/messages` | participant | History, newest first, cursor → 200 |
| POST | `/api/v1/conversations/{conversation}/messages` | participant | Body `{ id (ULID from client), body }` → 201 new, 200 same id already sent, 422 invalid, 429 over 30/min |
| POST | `/api/v1/conversations/{conversation}/read` | participant | Body `{ message_id }` → 204; only moves forward |

## 5. Live delivery

| Method | Path | Auth | Does |
|---|---|---|---|
| POST | `/broadcasting/auth` | verified | Approves private/presence channel subscriptions |

| Channel | Who may join | Events |
|---|---|---|
| `private-conversation.{id}` | participants | `message.sent` |
| `private-user.{id}` | that user | `conversation.updated` (new chat, new message, unread change) |

Sending a message: save → queue `MessageSent` + `ConversationUpdated` per other participant → Reverb pushes.

## 6. Group chats

| Method | Path | Auth | Does |
|---|---|---|---|
| POST | `/api/v1/conversations/groups` | verified | Body `{ name, user_ids[] }` → 201; caller becomes owner |
| PATCH | `/api/v1/conversations/{conversation}` | owner | Rename → 200 |
| POST | `/api/v1/conversations/{conversation}/participants` | owner, admin | Body `{ user_ids[] }` → 200; 422 over 100 members |
| PATCH | `/api/v1/conversations/{conversation}/participants/{user}` | owner | Body `{ role }` → 200 |
| DELETE | `/api/v1/conversations/{conversation}/participants/{user}` | owner, admin | Remove → 204; admins can't remove owner/admins |
| POST | `/api/v1/conversations/{conversation}/leave` | participant (group) | Leave; ownership moves on → 204 |

Removed users get `conversation.removed` on `private-user.{id}`.

## 7. Online status and typing

No endpoints.

| Channel | Who may join | Use |
|---|---|---|
| `presence-conversation.{id}` | participants | Who is online in this chat; `typing` whispers |

## Data model

```
users                      id ULID PK, name, username (unique, lowercase), email (unique),
                           email_verified_at, password, timestamps

conversations              id ULID PK, type (direct|group), name nullable,
                           direct_key nullable UNIQUE  -- "<smallerUserId>:<largerUserId>"
                           created_by → users, last_message_at nullable (indexed), timestamps

conversation_participants  id, conversation_id → conversations, user_id → users,
                           role (owner|admin|member), last_read_message_id nullable,
                           joined_at, timestamps
                           UNIQUE (conversation_id, user_id), INDEX (user_id)

messages                   id ULID PK (client-made), conversation_id → conversations,
                           user_id → users, body text, edited_at nullable,
                           timestamps, deleted_at
                           INDEX (conversation_id, id)
```

## Build order

1. Scaffold
2. Account
3. People and direct chats
4. Messages
5. Live delivery
6. Group chats
7. Online status and typing

Each step is a vertical slice: API lesson(s) → web lesson(s) → both checks green → `/to-pr` into `next`.

## Before the first deploy
- Restrict `/docs` and `/docs.openapi` (Scribe `laravel.middleware`, or skip the routes outside `local`). Today anyone can read the API map.

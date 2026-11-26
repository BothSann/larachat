# larachat

Real-time chat where every verified user can see and message every other verified user.

## Language

### Accounts

**User**:
A person with an account: name, unique lowercase username, email, password.
_Avoid_: Account, member (member is a group role)

**Username**:
A user's current `@handle`. Search finds a user only by the start of their username, never by name or email. A user can change it any time, even before they are verified. Changing it frees the old one for anyone to take straight away.
_Avoid_: Handle, nickname, display name (that's the name)

**Profile**:
A user's name and username: the parts of a user they can change themselves. Email and password aren't part of it.
_Avoid_: Account, settings

**Password reset**:
Setting a new password through a link sent to the user's email. Verified and unverified users can both do it. It does not verify the email. It ends every session the user has, including remembered ones, and does not log them in: they log in again with the new password.
_Avoid_: Password recovery, forgot password (that's only the first half)

**Password change**:
Setting a new password while logged in, by giving the current password first. It ends every other session the user has and keeps the one they used to make the change.
_Avoid_: Password reset (that's the emailed-link flow for a forgotten password), update password

**Session**:
One login on one browser. It ends when the user logs out, resets their password, or changes their password in another session.
_Avoid_: Login (that's the act of starting one), token

**Reset link**:
The link in a password reset email. Only the newest one a user asked for works, it expires after 60 minutes, and it works once. Asking for it gives the same answer whether the email has an account or not.
_Avoid_: Reset token (that's the secret inside the link), recovery link

**Verified user**:
A user who has proven they own their email by opening the link sent to it. Only verified users can find people or chat, and only verified users can be found. Every verified user can see every other verified user, without searching.
_Avoid_: Confirmed, activated

**Unverified user**:
A user who has signed up but not yet opened their email link. They can log in and see who they are, but can't chat.
_Avoid_: Pending, inactive

**Verification email**:
The email holding the link that turns an Unverified user into a Verified user. A user can ask for it again until they are verified.
_Avoid_: Welcome email, confirmation email

**People**:
Every verified user except you, in username order. A search narrows it to users whose username starts with the text typed.
_Avoid_: Contacts, friends, directory (there is no step to add someone)

### Online status

**Online**:
A user who has the app open and connected in at least one browser tab, even if that tab is in the background.
_Avoid_: Active, available, present

**Offline**:
A user who is not online. There is no state in between.
_Avoid_: Away, idle, last seen

### Conversations

**Conversation**:
A place where users exchange messages. It is either a Direct conversation or a Group conversation.
_Avoid_: Chat (UI wording only, as in the `/chats` page), thread, room, channel (that's the realtime transport)

**Direct conversation**:
A conversation between exactly two different verified users. Each pair of users has at most one. Trying to start one with an unverified user gets the same answer as with a user that does not exist.
_Avoid_: DM, private chat, 1:1

**Group conversation**:
A conversation with a name, started by one user for several others.
_Avoid_: Group chat, room, channel

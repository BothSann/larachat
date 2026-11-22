# larachat

Real-time chat between people who know each other's usernames.

## Language

### Accounts

**User**:
A person with an account: name, unique lowercase username, email, password.
_Avoid_: Account, member (member is a group role)

**Username**:
A user's current `@handle`, which is how people find each other. A user can change it any time, even before they are verified. Changing it frees the old one for anyone to take straight away.
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

**Reset link**:
The link in a password reset email. Only the newest one a user asked for works, it expires after 60 minutes, and it works once. Asking for it gives the same answer whether the email has an account or not.
_Avoid_: Reset token (that's the secret inside the link), recovery link

**Verified user**:
A user who has proven they own their email by opening the link sent to it. Only verified users can find people or chat.
_Avoid_: Confirmed, activated

**Unverified user**:
A user who has signed up but not yet opened their email link. They can log in and see who they are, but can't chat.
_Avoid_: Pending, inactive

**Verification email**:
The email holding the link that turns an Unverified user into a Verified user. A user can ask for it again until they are verified.
_Avoid_: Welcome email, confirmation email

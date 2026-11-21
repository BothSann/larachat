# larachat

Real-time chat between people who know each other's usernames.

## Language

### Accounts

**User**:
A person with an account: name, unique lowercase username, email, password.
_Avoid_: Account, member (member is a group role)

**Verified user**:
A user who has proven they own their email by opening the link sent to it. Only verified users can find people or chat.
_Avoid_: Confirmed, activated

**Unverified user**:
A user who has signed up but not yet opened their email link. They can log in and see who they are, but can't chat.
_Avoid_: Pending, inactive

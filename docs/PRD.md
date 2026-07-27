# Cupid Match Chat — Private Product Requirements

**Users:** Owner (admin) and partner only. No public launch or public registration.

## Product

Cupid Match Chat is a private browser site for two people. It opens as **Little Library**, a genuine book-reading/inspiration page. After private sign-in and an agreed room code, the users enter a short-lived chat with text, emoji, files, voice notes, normal audio calls, and video calls.

The book content (quotes, covers, notes) is supplied by the owner. The private-entry experience improves discretion but cannot guarantee invisibility or protect against screenshots, compromised devices, browser extensions, network monitoring, or saved recipient copies.

## Accounts

1. Landing page offers **Log in** and **Create account**.
2. Create account requires username, password, confirm password, room code, and a private access code for the login section.
3. Only two accounts may exist. After setup, registration is disabled until the admin deletes an account.
4. Login requires username, password, and access code. Failed login uses a neutral message without confirming whether a username exists.
5. A profile sheet includes **Log out**. Logout clears auth/session/chat state and returns to Little Library.
6. Passwords are handled by Supabase Auth only; raw passwords are never stored by the app.

## Roles

| Role | Permissions |
|---|---|
| Owner/admin | Use chat; access personal admin settings; manage the two accounts; change room/access-code settings; see app status |
| Partner | Use chat and manage own session/profile |

The personal admin panel must never show plaintext messages, attachment contents, room secrets, encryption keys, or call media.

## Core features

- Little Library landing page with owner-provided books, quotes, shelves, and inspiration cards.
- Private, keyboard-accessible entry to room/login screens.
- One shared room with a high-entropy room code and separate room secret; maximum two active participants.
- Real-time text, emoji/reactions, original stickers, image/video/audio/document attachments, and voice notes.
- Five-minute automatic expiry for messages and attachments; refresh, logout, and Quick Exit clear the local visible transcript.
- **Audio call** (normal call) with mute, speaker/device choice, elapsed time, and hang-up.
- **Video call** with mute, camera toggle, local preview, connection state, and hang-up.
- Profile sheet with Quick Exit; it immediately stops camera/mic, clears local state, and returns to Little Library.

## Personal admin panel

- Owner-only screen opened from the profile sheet.
- **Accounts:** view two usernames and active state; disable, reset, or delete an account.
- **Room:** change room code and private access-code configuration.
- **Status:** show online/offline state, storage cleanup health, and expiry-job status only.
- Require recent re-authentication before destructive account/room changes.

## Hosting

- **Vercel** (assumed meaning of “Versal”) hosts the web app and server routes.
- **Supabase** provides Auth, PostgreSQL, Realtime, and Storage.
- Audio/video calls are browser WebRTC calls. Test direct calls first. Add a small TURN server only if calls fail across certain mobile/carrier networks; TURN relays encrypted traffic to make the connection possible.

## UI requirements

- Mobile-first, original, iPhone-inspired appearance: grouped rounded cards, calm colors, clean outline icons, compact sheets, and clear large tap targets.
- Do not copy Apple, Instagram, Pinterest, or another product’s branded assets/UI.
- Include visible focus, keyboard access, readable contrast, labels, and clear permission/error wording.

## Acceptance checklist

- The two intended users can create, log in, log out, and join the shared room; a third account/session is rejected.
- Admin can manage account/room settings but cannot inspect private chat/call content.
- Text, attachments, voice notes, audio calls, and video calls work between the two browsers.
- Refresh, logout, Quick Exit, and five-minute expiry clear chat as specified.
- No plaintext chats, passwords, secrets, or call data appear in logs.

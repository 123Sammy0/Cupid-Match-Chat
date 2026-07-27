# Cupid Match Chat — Private Technical Requirements

## Stack

- **Next.js + TypeScript** application deployed on **Vercel**.
- **Supabase Auth** for account sessions and secure password storage.
- **Supabase Postgres** for profile/room/expiry metadata, protected by Row Level Security (RLS).
- **Supabase Realtime** for room presence, message relay, and WebRTC signaling.
- **Supabase Storage** for short-lived encrypted attachments.
- **Vercel Cron** calls a protected cleanup route every minute to delete expired rows and storage objects.
- **WebRTC** provides audio and video. Start with STUN/direct calls. A small coturn server is optional only if network testing needs it.

## Roles and authentication

1. `profiles` table: `id`, `username`, `role` (`admin` or `partner`), `active`, `created_at`.
2. First registered account becomes `admin`; second becomes `partner`; server-side registration refuses a third account.
3. Sign-up route validates the private access code and creates the Supabase Auth account. Never store raw passwords/access codes.
4. Login checks username/password through Supabase Auth and validates the login access code through a protected route.
5. Logout calls Supabase sign-out and clears browser room/crypto state.
6. RLS allows users to read only their own profile; protected server routes allow the admin’s limited account/room actions.

## Data

| Data | Stored until |
|---|---|
| Profile username/role/active state | Account deletion or admin change |
| Room code hash and secret verifier | Room configuration change |
| Session hash and presence | Logout/session expiry |
| Encrypted message envelope, nonce, expiry | Five minutes |
| Encrypted attachment object/reference | Five minutes |
| Admin audit event without content | Small personal operational retention period |

Never store plaintext messages/files, raw passwords, room secrets, encryption private keys, raw call media, or full signaling payloads in logs.

## API/routes

| Route/action | Purpose |
|---|---|
| `POST /api/auth/register` | Validate private access code and two-account limit; create account |
| `POST /api/auth/login-gate` | Validate private login access code without revealing account existence |
| Supabase Auth sign-in/sign-out | Password session handling |
| `POST /api/room/join` | Check room code/secret and two-session capacity |
| `POST /api/upload-intent` | Issue short-lived attachment upload authorization |
| Supabase Realtime channel | Encrypted messages, presence, typing, WebRTC offer/answer/ICE/hang-up |
| `/admin` protected routes | Account/room/status changes; no message content route |
| `GET /api/cron/cleanup` | Delete expired rows/objects and report cleanup result |

## Calls

- **Normal call** means audio-only WebRTC: microphone permission, mute, output-device choice, elapsed time, hang-up.
- **Video call** means WebRTC audio + camera: mute, camera toggle, local preview, connection state, hang-up.
- Calls use browser DTLS-SRTP encryption. Signaling is transient through Supabase Realtime.
- If a direct call cannot connect because of NAT/firewall/mobile carrier restrictions, a TURN server relays encrypted packets. It cannot read the call, but can add bandwidth cost.
- Stop tracks and close peer connections on hang-up, Quick Exit, logout, refresh, session revocation, and expiry.

## Security baseline

- HTTPS, strict origin checks, validated API/event schemas, and rate limits for registration/login/join/upload.
- High-entropy room code; room secret stored only as a strong verifier/hash.
- Store browser auth and room cryptographic material in memory, not URL/localStorage.
- Use client-side encryption with established Web Crypto/reviewed libraries before claiming E2EE.
- Supabase RLS denies all table/storage access by default, then permits only the required authenticated two-user operations.
- Keep Vercel/Supabase keys in Vercel environment variables, never source code.

## Folder layout

```text
cupid-match-chat/
  app/                  # Little Library, auth, chat, admin, API routes
  components/           # iPhone-inspired reusable UI
  lib/                  # Supabase, room, crypto, WebRTC helpers
  supabase/migrations/  # schema, RLS, storage policies
  docs/                 # PRD, TRD, UI UX
```

# Cupid Match Chat — Admin Panel TRD

## 1. Implementation approach

- Build `/admin` inside the same Next.js/Vercel application.
- Use Supabase Auth for the active user identity.
- Store `role` in `profiles`: `admin` or `partner`. The requested admin-read model means messages are not E2EE against the administrator.
- Enforce admin authorization in both Next.js server routes and Supabase RLS. UI hiding alone is never security.
- Use Vercel environment variables for Supabase service-role credentials; service-role key is server-only and never sent to the browser.

## 2. Authorization flow

1. Middleware checks there is an authenticated Supabase session.
2. Server reads the authenticated profile and confirms `role = 'admin'` and `active = true`.
3. Non-admin requests return `403` from APIs and redirect from pages.
4. Sensitive actions require a recent-auth timestamp (for example, within 10 minutes); otherwise request password re-authentication using Supabase Auth.

## 3. Data tables

```text
profiles
  id uuid PK (Supabase Auth user ID)
  username text unique
  role text check (admin, partner)
  active boolean
  created_at timestamptz
  last_login_at timestamptz null

app_settings
  key text PK
  value_encrypted text
  updated_at timestamptz
  updated_by uuid FK profiles

admin_audit
  id uuid PK
  actor_id uuid FK profiles
  action text
  target_type text
  target_id text null
  created_at timestamptz
  metadata jsonb -- non-sensitive values only

cleanup_runs
  id uuid PK
  started_at timestamptz
  finished_at timestamptz
  status text
  deleted_messages integer
  deleted_attachments integer
  error_summary text null

emergency_actions
  id uuid PK
  actor_id uuid FK profiles
  target_profile_id uuid FK profiles
  action text -- lock, unlock, delete_room_data
  created_at timestamptz
  completed_at timestamptz null
```

Room secrets and access codes are not displayed or stored as recoverable plaintext. Store only suitable secure verifiers/hashes. Chat/attachment records have explicit admin-read access only until expiry; expired content remains unavailable.

## 4. RLS policies

- `profiles`: normal users can read/update only their own allowed fields. Admin writes occur through protected server APIs.
- `app_settings`, `admin_audit`, `cleanup_runs`: deny direct browser table access. Only server-side admin routes with verified admin role may read/write.
- Chat and attachment tables: the admin receives an explicit, audited read/delete policy for currently retained room content; the partner gets participant access only.
- Storage: attachment objects use time-limited signed access for participants and explicit audited admin access while retained.

## 5. Admin API

| Route | Method | Function |
|---|---|---|
| `/api/admin/overview` | GET | Counts and non-sensitive status cards |
| `/api/admin/accounts` | GET | List two profile summaries |
| `/api/admin/accounts/:id/status` | PATCH | Enable/disable partner |
| `/api/admin/accounts/:id/logout` | POST | Revoke partner sessions |
| `/api/admin/accounts/:id` | DELETE | Delete partner after confirmation/re-auth |
| `/api/admin/settings` | GET/PATCH | Read masked settings metadata / update room-access configuration |
| `/api/admin/status` | GET | Supabase, Realtime, cleanup, storage, deployment health |
| `/api/admin/audit` | GET | Paginated non-content audit events |
| `/api/admin/messages` | GET | Paginated currently retained room messages |
| `/api/admin/messages/:id` | DELETE | Delete one retained message and notify connected clients |
| `/api/admin/messages` | DELETE | Delete all retained room content after confirmation |
| `/api/admin/attachments/:id` | DELETE | Delete retained attachment/object reference |
| `/api/admin/emergency-lock` | POST | Revoke partner sessions, close room/call, pause room, optionally delete retained data |
| `/api/admin/emergency-unlock` | POST | Re-enable access after admin re-authentication |

Every route validates inputs, uses the authenticated admin ID for audit data, rate-limits requests, and returns generic errors. Never return room secret, access code, password, encryption key, or live signaling data. Content routes return only currently retained material needed by this explicit admin-access model.

## 6. Cleanup and status

- Vercel Cron calls a protected cleanup route every minute.
- Cleanup deletes rows/objects past TTL, writes aggregate counts to `cleanup_runs`, and retries safe failures.
- Admin status calls a small health endpoint or reads latest `cleanup_runs`; it must not expose credentials or internal endpoints.
- Deployment version comes from a safe Vercel build environment variable, not a Vercel management API requirement.

## 7. Emergency Lock implementation

1. Verify admin session and recent password re-authentication.
2. Disable/lock the partner profile and revoke its Supabase sessions using a server-only Admin API.
3. Pause the room and publish signed `emergency.lock` to active room clients.
4. Connected clients stop WebRTC tracks, close calls, clear local room state, and return to Little Library.
5. If selected, delete retained message rows and attachment objects and write aggregate deletion results to audit data.
6. Unlock is explicit, requires re-authentication, and creates a second audit record.

Offline devices cannot receive the lock event immediately, but their session is rejected on reconnect. Do not implement operating-system deletion, browser-history deletion, or partner-account impersonation.

## 8. Tests

- Unit-test role guard, recent-auth check, payload validation, audit creation, and masked settings response.
- Integration-test RLS with admin, partner, unauthenticated, and disabled sessions.
- E2E-test admin overview, account disable/force logout, setting change/session invalidation, and partner denial.
- Integration-test message/attachment viewer and single/bulk deletion with realtime client removal.
- E2E-test Emergency Lock: partner session is revoked, call ends, room is paused, and connected UI returns to Little Library.
- Security regression: assert no admin response contains raw password, room secret, access code, encryption key, or live call media.

# Cupid Match Chat — Admin Panel PRD

**Purpose:** Owner-only personal control panel for a private two-person app.  
**Privacy model:** The owner/admin can deliberately read retained chat content in this personal deployment. Both users should agree to this. It is not end-to-end encrypted against the administrator.

## 1. User and access

- Only the account marked `admin` may access `/admin`.
- The partner account is redirected to chat/Little Library if it attempts to open `/admin`.
- Admin access requires an active login and recent re-authentication before sensitive actions.
- There is only one admin in v1: the owner.

## 2. Goals

- Manage the two private accounts safely.
- Manage shared room and access-code settings.
- Confirm that app connections, auto-expiry, storage cleanup, and deployment are working.
- Keep the panel simple enough to build alongside the main chat application.
- Remotely lock a lost or unsafe partner device and delete currently retained room data.

## 3. Pages and features

### 3.1 Admin overview

Show at a glance:

- Number of registered accounts: `0 / 2`, `1 / 2`, or `2 / 2`.
- Account active/disabled state (no passwords or secrets).
- Shared room status: active/inactive and current two-session capacity.
- Last successful expiry/cleanup run.
- Current app version/deployment time.
- Compact actions: Manage accounts, Room settings, App status.

### 3.2 Accounts

For each account, show username, role, active state, creation time, and last successful login time.

Admin actions:

- Disable/enable partner account.
- Force partner logout from all devices.
- Delete partner account after a confirmation step.
- Re-open private registration only after an account is deleted.

The owner/admin account cannot be deleted or demoted through the panel in v1.

### 3.3 Room settings

- Change shared room code.
- Change the private login/registration access code.
- Enable/disable new room access temporarily.
- Set the automatic expiry duration, with five minutes as the maximum.
- Show when settings were last changed.

Changing room code/access code invalidates current room sessions and requires both users to log in again.

### 3.4 App status

- Supabase connection status.
- Vercel deployment/version status.
- Realtime connection status.
- Cleanup job: last run, result, expired messages/files deleted, and any error message without sensitive data.
- Storage usage summary suitable for a small free-tier project.
- WebRTC test status: direct audio/video test succeeds/fails. Do not show call content or history.

### 3.5 Current chat and deletion

- Show only the chat content and attachments still retained before expiry.
- Allow the admin to delete one message, selected messages, all current messages, one attachment, or all retained attachments.
- Bulk delete requires confirmation and admin password re-entry. A realtime event clears the connected browsers' visible app transcript.
- The panel cannot recover expired content, screenshots, downloads, or copies made outside the app.

### 3.6 Emergency Lock

Emergency Lock is for a lost, stolen, or temporarily unsafe partner device—not for silently impersonating the partner.

When confirmed, it revokes partner sessions, disconnects the room, ends an active call, clears state from connected browsers, and pauses room access. The admin may additionally choose **Delete current room data** to remove all retained messages/files from server storage. Offline devices are blocked when they next reconnect.

It cannot erase screenshots, downloads, browser history, or data on an offline device.

### 3.7 Audit list

Show a minimal owner-only activity record: sign-in, account enable/disable/delete, room settings change, message deletion, emergency lock/unlock, forced logout, cleanup errors, and app errors. Each record has time, action, and target username/setting. It never contains passwords, room secrets, access codes, encryption keys, or call media.

## 4. Safety rules

- Admin content access is explicit; do not describe the app as E2EE against the owner/admin.
- Admin API can access retained messages/attachments but has no endpoint for encryption keys, live media streams, or call recordings.
- Sensitive actions require a confirmation sheet and current password re-entry.
- Record sensitive actions in audit data.
- On logout, clear dashboard data and return to Little Library.
- Use neutral errors: do not reveal internal keys, database details, or secrets.

## 5. Acceptance criteria

- Partner cannot load admin pages or call admin APIs.
- Owner can disable/enable/delete partner and force logout.
- Owner can change room/access settings; old sessions become invalid.
- Owner can view currently retained messages and delete individual/all retained messages and attachments.
- Emergency Lock ends a connected call, logs out the partner, pauses the room, and clears connected-client app state.
- Admin sees accurate health/cleanup status.
- Dashboard never displays raw passwords, room secrets, access codes, encryption keys, or call media.

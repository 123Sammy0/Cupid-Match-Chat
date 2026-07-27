# Cupid Match Chat — Admin Panel UI/UX

## Visual style

Use the same warm, iPhone-inspired system as chat: cream background, grouped rounded settings cards, simple outline icons, large touch targets, and bottom-sheet confirmations. This is a personal settings area, not a complex business dashboard.

## Navigation

Admin opens **Personal settings** from the chat profile sheet.

```text
Personal settings
  Overview
  Current chat
  Accounts
  Room & privacy
  App status
  Activity
  Back to chat
```

On mobile, use a single scroll page with grouped sections; on desktop, use a narrow left sidebar and content panel.

## Overview

```text
┌──────────────────────────────┐
│ Personal settings            │
│                              │
│ Accounts                     │
│  ● 2 of 2 private accounts   │
│                              │
│ Private room                 │
│  Active · max 5 min expiry   │
│                              │
│ App health                   │
│  ● Everything is working     │
└──────────────────────────────┘
```

Three tap cards lead to Accounts, Room & privacy, and App status. Add a fourth **Current chat** card that shows the retained-message count and expiry reminder. Use plain language, not developer terminology.

Add a separate amber **Emergency Lock** card. It should never be hidden inside another setting.

## Current chat screen

- Reverse-chronological transcript with sender, timestamp, text, and safe attachment cards.
- Header says “Current chat” with an expiry reminder such as “Automatically removed in 03:12.”
- Each item has an overflow menu with **Delete message**; attachment cards have **Delete file**.
- Header action **Delete all current chat** requires a two-step confirmation and admin password re-entry.
- Empty state: “There is no retained chat to show.”
- Never show call audio/video or expired content.

## Accounts screen

- Grouped list of the two accounts with avatar initial, username, role label, and Active/Disabled status.
- Partner row opens details: **Disable account**, **Log out everywhere**, **Delete account**.
- Destructive actions use a confirmation bottom sheet: explain the effect, request admin password, and provide Cancel / destructive confirm button.
- Admin’s own row is visibly protected: “Owner account.” No delete or role-change control.

## Room & privacy screen

- Rows: Room code, Login access code, Room access, Message expiry.
- Codes are always shown masked, e.g. `••••••••`; tap **Change** to enter a new value and confirm it.
- Room access is a simple enabled/paused switch.
- Expiry is a choice row: 1, 2, 3, 4, or 5 minutes; state “Messages disappear automatically.”
- Changing a code shows: “Both people will need to log in again.”

## Emergency Lock screen

- Use an amber/red-tinted safety card with: “Lock your partner’s access if their device is lost, taken, or unsafe.”
- Main action: **Lock and log out partner**.
- Optional checkbox: **Also delete current room messages and files**.
- Confirmation explains: “Active calls will end. Connected browsers will close the chat. Offline devices will be blocked when they reconnect. Screenshots and downloaded files cannot be removed.”
- Require admin password confirmation. Completion state: “Partner access is locked.”
- **Unlock access** requires another admin re-authentication.

## App status screen

- Simple status rows with an icon and plain label: Supabase, Realtime chat, Auto-cleanup, Storage, Direct call test.
- Good state: green dot + “Working.”
- Problem state: amber/red dot + short next step, e.g. “Cleanup needs a retry.”
- Show last cleanup time and totals only, never private content.

## Activity screen

- Simple reverse-chronological list: “Room settings changed”, “Partner logged out”, “Current chat deleted”, “Emergency Lock used”, “Cleanup completed”, and non-sensitive app errors.
- Each item shows time and small icon.
- Do not show passwords, room codes, access codes, encryption keys, or call media.

## States and accessibility

- Loading: skeleton grouped cards, never a blank page.
- Denied: non-admin sees “This area is only for the owner” and Back to Library.
- Error: “That change could not be saved. Try again.”
- All buttons have labels, 44×44 px minimum targets, visible focus, sufficient contrast, keyboard support, and reduced-motion support.

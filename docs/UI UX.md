# Cupid Match Chat — UI/UX

## Style

Private, warm, calm, and **iPhone-inspired**: grouped rounded cards, clean hierarchy, translucent sheets used sparingly, familiar outline icons, 44 px minimum tap targets, and short subtle motion. Use original assets and icons; do not copy Apple, Instagram, Pinterest, or any other brand.

Suggested palette: cream `#FFF9F4`, rose `#D97A89`, plum `#3A2034`, lavender `#EEE7F7`, connected green `#5E9C7D`.

## Landing — Little Library

The opened site looks like a real personal reading/inspiration page.

- Top bar: Little Library, Browse, Collections, search, bookmark icon.
- Featured book with cover, author, owner-provided note, and “Read notes.”
- Shelves: Reading now, Quiet classics, Saved for later.
- Lower masonry board of owner-provided quotes, book images, and calm inspiration cards.
- Book detail panel: synopsis, tags, saved state, and owner-provided note.
- No visible chat content or public account discovery.

A mutually known, keyboard-accessible secret action opens the private account sheet. It is discreet access, not a promise of invisibility.

## Account sheets

### First screen

Little Library shows **Log in** and **Create account** as small, neutral actions.

### Create account

Grouped iPhone-style form fields: Username, Password, Confirm password, Room code, Private access code. Primary button: **Create private account**. Text: “This space is limited to two people.” After two accounts exist, show only login.

### Login

Fields: Username, Password, Private access code. Primary button: **Log in**. Failure text: “The login details don’t match.” Do not say which field was wrong.

### Profile sheet

From chat, the avatar opens a bottom sheet showing username, an Admin badge only for the owner, **Log out**, and **Quick Exit**. Admin additionally sees **Personal settings**.

## Chat

```text
┌────────────────────────────────────────────────────────────┐
│ ♥ Cupid Match Chat  Connected · 04:37  [audio] [video] [●] │
├────────────────────────────────────────────────────────────┤
│  Partner bubble                            Your bubble     │
│  [photo/file/voice note preview]                            │
├────────────────────────────────────────────────────────────┤
│ [＋] [😊]  Write something…                   [voice] Send │
└────────────────────────────────────────────────────────────┘
```

- Partner messages left/lavender; own messages right/rose.
- Header shows connection and expiry countdown, then audio-call, video-call, and avatar buttons.
- Composer provides attachment, emoji/sticker, auto-growing text field, voice note, and Send.
- Attachment previews show filename/type/size, progress, remove/retry.
- Voice note flow: record, pause, preview, discard, send.
- At expiry, remove timeline and show “This private room has closed” with Return to Library.

## Calls

- **Audio call:** calm full-screen panel, partner status, timer, mute, speaker/device choice, and prominent End Call.
- **Video call:** remote video fills the view; draggable local preview in a safe corner; mute/camera/end controls stay visible.
- Permission failure: “Camera or microphone access is off. Change it in browser settings to call.”
- Connection failure: “Couldn’t connect. Try again or check your network.”

## Admin screen

Owner-only page with iPhone-style grouped settings:

- **Accounts:** two usernames, active/disabled state; disable/reset/delete partner account.
- **Room:** update room code and login access-code settings.
- **App status:** connection state, current cleanup status, storage status only.
- Do not show chat, files, call history, secrets, or encryption keys.

## Mobile and accessibility

- Keep composer above the mobile keyboard; use bottom sheets for attachment/profile controls.
- All controls have labels, keyboard focus, readable contrast, and non-color status indicators.
- Respect reduced-motion preference; announce connection, expiry, and upload states accessibly.
- Quick Exit immediately stops media, clears local chat state, and returns to Little Library without a detailed toast.

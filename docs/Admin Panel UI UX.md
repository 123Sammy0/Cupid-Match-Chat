# Cupid Match Chat — Admin Panel UI/UX

## Visual Style
The admin panel must maintain the same premium, calm, iPhone-inspired system as the rest of the application. Do not rely on generic HTML tables. Use grouped, rounded settings cards, clear visual hierarchies, and simple outline icons.

## Navigation
The admin panel is accessed via the user's profile settings.

## Screens

### 1. Dashboard Overview
- A clean grid of metric cards: Total Users, System Health, and Gate Status.

### 2. Accounts List
- A scrollable, elegant list view of all N-users.
- Each row displays an avatar, username, and a status badge (Active/Locked).
- Tapping a user reveals a bottom sheet or expanded card with actions: **Lock Account**, **Unlock Account**.

### 3. System Activity
- A timeline view of the `admin_audit` logs.
- Icons should indicate the type of action (e.g., shield for security actions, gear for settings changes).

## Accessibility
- All interactive elements must meet the 44x44px touch target minimum.
- Use explicit labels and accessible colors for status indicators (e.g., red for locked, green for active, but ensuring contrast passes WCAG standards).

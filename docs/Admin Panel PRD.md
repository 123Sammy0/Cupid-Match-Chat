# Cupid Match Chat — Admin Panel PRD

## Purpose
The Admin Panel is a secure, owner-only dashboard designed to monitor and manage the N-user messaging platform. It allows the administrator to maintain platform health and enforce moderation without compromising the privacy of user conversations.

## 1. User and Access
- Only accounts with `role = 'admin'` can access `/admin`.
- Standard users attempting to access `/admin` are immediately redirected to their inbox.

## 2. Core Goals
- Manage all registered accounts on the platform (N-users).
- Monitor platform health, cron jobs, and Supabase connections.
- Enforce emergency locks on compromised accounts.

## 3. Pages and Features

### 3.1 Admin Overview
- Key metrics: Total registered users, active connections, and system health status.

### 3.2 Accounts Management
- A paginated list of all users on the platform.
- Shows username, role, active state, and last login.
- **Actions:** The admin can disable (lock) or enable any user account, forcing logout for compromised users.

### 3.3 Platform Settings
- Manage the global Gate PIN required to access the authentication portal.

### 3.4 App Status & Audit Logs
- View a non-sensitive audit log of administrative actions (e.g., "Account locked", "Gate PIN changed").
- Monitor storage usage and automated database cleanup job statuses.

## 4. Privacy & Security Rules
- **No Content Access:** The admin panel does NOT provide a back-door to read user messages or view attachments.
- **Audit Trails:** All destructive or sensitive actions taken by an admin must be logged securely.

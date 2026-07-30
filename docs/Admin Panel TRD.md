# Cupid Match Chat — Admin Panel TRD

## 1. Implementation Approach
- The Admin dashboard is integrated directly into the Next.js application under the `/admin` route group.
- Server Actions enforce role-based access control (RBAC). The server verifies `role === 'admin'` before fulfilling any data requests or mutations.

## 2. Data Access & RLS
- **`profiles`:** Admins have unrestricted read access to profiles for management purposes via the Supabase Service Role key inside Server Actions.
- **`admin_audit`:** Admins can read audit logs.
- RLS explicitly denies standard users from reading `admin_audit` or viewing other users' profiles unless they are part of a shared conversation.

## 3. Server Actions
- `lockAccountAction(userId, isLocked)`: Updates the `active` boolean on a user profile. If set to false, it should also trigger a session revocation.
- `updateGatePin(newPin)`: Securely updates the global access PIN.
- `getAuditLogs()`: Fetches paginated logs for the dashboard.

## 4. Security Rules
- Server Actions must never return chat content or encryption keys to the admin dashboard.
- The UI relies on Server Components to pre-fetch and authorize admin data, ensuring no sensitive admin data is ever serialized to standard users' client bundles.

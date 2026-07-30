# Cupid Match Chat — Technical Requirements Document

## Core Stack
- **Framework:** Next.js (App Router) + TypeScript.
- **Hosting:** Vercel.
- **Backend-as-a-Service:** Supabase (Auth, PostgreSQL, Realtime, Storage).
- **Styling:** Tailwind CSS (Vanilla CSS for custom aesthetic constraints).

## Architecture Philosophy
The objective is to create a cohesive, premium, production-ready messaging platform where every architectural decision contributes to long-term maintainability, scalability, and security.

### Performance Requirements
The platform must be designed for long-term scalability without requiring major architectural rewrites:
- Minimize database queries (use efficient joins and views).
- Optimize Supabase Realtime subscriptions (clean up on unmount, target specific channels).
- Implement lazy loading for media and long conversation histories.
- Avoid unnecessary React re-renders.
- Ensure smooth 60fps UI interactions across desktop and mobile.

### Security Requirements
The platform is privacy-first by default:
- **Authentication:** Supabase Auth handles all passwords securely. Raw passwords are never logged or stored manually.
- **Authorization:** Strict Row Level Security (RLS) ensures users can only access their own profiles, conversations, and chat requests.
- **Data Protection:** Server-side validation is required for all mutations via Next.js Server Actions.
- **Future Proofing:** The architecture must be capable of supporting true End-to-End Encryption (E2EE) and secure WebRTC signaling for calls in the future.

## API & Data Flow
- **Mutations:** Exclusively use Next.js Server Actions for operations like login, signup, sending chat requests, and updating profiles.
- **Realtime:** Supabase Realtime handles real-time message delivery, presence, and typing indicators over WebSockets.
- **Scheduled Tasks:** Vercel Cron will trigger secure API routes for database cleanup, storage purging, and maintenance.

# Architecture Documentation

## Core Paradigms
- **App Router:** Full utilization of Next.js App Router features (Server Components, Layouts, Server Actions).
- **Zero-API (Mostly):** Traditional API routes (`/api`) are minimized in favor of Next.js Server Actions for mutations, reducing client-side boilerplate and improving type safety.
- **Client Components:** Used strictly for interactive UI elements (e.g., chat input, WebRTC video frames, infinite scroll).

## Subsystems

### 1. Authentication & Gate
- **Supabase Auth:** Manages session cookies securely.
- **Gate:** A custom middleware/cookie-based mechanism protects the `/auth` routes to ensure only users who know the PIN can attempt to log in.

### 2. Messaging & State
- **Database:** Normalized PostgreSQL schema.
- **Realtime:** Supabase Realtime subscriptions listen for new rows in the `messages` table for specific `conversation_id`s.
- **Optimistic UI:** Next.js `useOptimistic` or React state is used to display sent messages immediately before the database confirms the insertion.

### 3. Future Architecture Pathways
- **WebRTC:** Will be implemented using Supabase Realtime as the signaling server to exchange SDP offers/answers and ICE candidates.
- **E2E Encryption:** The architecture supports adding Web Crypto API logic to encrypt payloads on the client before sending them to Supabase, ensuring the server only stores ciphertext.
- **Scalability:** The `conversations` and `messages` tables are heavily indexed to support thousands of users without degraded performance. Lazy loading and pagination are mandatory for chat histories.

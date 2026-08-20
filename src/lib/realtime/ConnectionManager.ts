/**
 * ConnectionManager — Centralized realtime connection state tracker.
 *
 * Responsibilities:
 * - Track connection state: connected | connecting | reconnecting | disconnected
 * - Emit state change events via window CustomEvents
 * - Implement exponential backoff reconnect (1s → 2s → 4s → 8s → 16s → 30s cap)
 * - On reconnect: signal subscribers to restore subscriptions + gap-fill missed messages
 * - Subscribe to Supabase Realtime channel status changes
 *
 * Usage:
 *   import { connectionManager } from '@/lib/realtime/ConnectionManager';
 *   connectionManager.getState()        // 'connected' | 'connecting' | etc.
 *   connectionManager.onStateChange(cb) // subscribe
 *   connectionManager.destroy()         // cleanup
 */

export type ConnectionState = 'connected' | 'connecting' | 'reconnecting' | 'disconnected';

/** Custom event name dispatched on window */
export const CONNECTION_STATE_EVENT = 'global_connection_state';

/** Custom event name dispatched when reconnect completes and gap-fill is needed */
export const RECONNECT_COMPLETE_EVENT = 'global_reconnect_complete';

type StateChangeCallback = (state: ConnectionState) => void;

class ConnectionManagerImpl {
  private state: ConnectionState = 'connecting';
  private listeners: Set<StateChangeCallback> = new Set();
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;

  /** The timestamp of the last successfully received realtime event */
  private lastEventTimestamp: string | null = null;

  /** Max backoff in ms */
  private static readonly MAX_BACKOFF_MS = 30_000;
  /** Base backoff in ms */
  private static readonly BASE_BACKOFF_MS = 1_000;

  constructor() {
    // Initial state
    this.setState('connecting');
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  getState(): ConnectionState {
    return this.state;
  }

  /** Subscribe to state changes. Returns an unsubscribe function. */
  onStateChange(cb: StateChangeCallback): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  /** Record the timestamp of the last received realtime event (for gap-fill on reconnect) */
  recordEventTimestamp(timestamp: string): void {
    if (!this.lastEventTimestamp || timestamp > this.lastEventTimestamp) {
      this.lastEventTimestamp = timestamp;
    }
  }

  /** Get the last event timestamp for gap-fill queries */
  getLastEventTimestamp(): string | null {
    return this.lastEventTimestamp;
  }

  /**
   * Called by the realtime channel subscription status callback.
   * Maps Supabase channel statuses to our connection states.
   */
  handleChannelStatus(status: string, err?: Error): void {
    if (this.destroyed) return;

    switch (status) {
      case 'SUBSCRIBED':
        this.onConnected();
        break;
      case 'CHANNEL_ERROR':
      case 'TIMED_OUT':
        console.warn('[ConnectionManager] Channel error/timeout:', status, err?.message);
        this.onDisconnected();
        break;
      case 'CLOSED':
        this.onDisconnected();
        break;
      default:
        // 'SUBSCRIBING' etc.
        if (this.state === 'disconnected' || this.state === 'reconnecting') {
          this.setState('reconnecting');
        } else {
          this.setState('connecting');
        }
    }
  }

  /** Force a state (used when we know the connection is down, e.g. Page Visibility API) */
  forceState(newState: ConnectionState): void {
    if (this.destroyed) return;
    this.setState(newState);
  }

  /** Signal that a reconnect attempt should be made */
  scheduleReconnect(reconnectFn: () => Promise<void>): void {
    if (this.destroyed) return;
    if (this.reconnectTimer) return; // already scheduled

    this.setState('reconnecting');
    const delay = Math.min(
      ConnectionManagerImpl.BASE_BACKOFF_MS * Math.pow(2, this.reconnectAttempts),
      ConnectionManagerImpl.MAX_BACKOFF_MS
    );

    console.log(`[ConnectionManager] Scheduling reconnect attempt ${this.reconnectAttempts + 1} in ${delay}ms`);

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      this.reconnectAttempts++;

      try {
        await reconnectFn();
        // If reconnectFn succeeds, handleChannelStatus('SUBSCRIBED') will be called
        // which resets reconnectAttempts via onConnected()
      } catch (err) {
        console.error('[ConnectionManager] Reconnect attempt failed:', err);
        // Schedule another attempt
        this.scheduleReconnect(reconnectFn);
      }
    }, delay);
  }

  destroy(): void {
    this.destroyed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.listeners.clear();
  }

  // ── Private ─────────────────────────────────────────────────────────────────

  private onConnected(): void {
    const wasDisconnected = this.state === 'reconnecting' || this.state === 'disconnected';
    this.reconnectAttempts = 0;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.setState('connected');

    // If we just recovered from a disconnect, signal gap-fill
    if (wasDisconnected && this.lastEventTimestamp) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(RECONNECT_COMPLETE_EVENT, {
          detail: { lastEventTimestamp: this.lastEventTimestamp }
        }));
      }
    }
  }

  private onDisconnected(): void {
    this.setState('disconnected');
  }

  private setState(newState: ConnectionState): void {
    if (this.state === newState) return;

    const prevState = this.state;
    this.state = newState;

    console.log(`[ConnectionManager] ${prevState} → ${newState}`);

    // Notify listeners
    this.listeners.forEach(cb => {
      try { cb(newState); } catch (e) { console.error('[ConnectionManager] Listener error:', e); }
    });

    // Dispatch window event for components that listen via addEventListener
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(CONNECTION_STATE_EVENT, {
        detail: { state: newState, previousState: prevState }
      }));
    }
  }
}

// ── Singleton ──────────────────────────────────────────────────────────────────
let instance: ConnectionManagerImpl | null = null;

export function getConnectionManager(): ConnectionManagerImpl {
  if (!instance) {
    instance = new ConnectionManagerImpl();
  }
  return instance;
}

/** Reset the singleton (used in tests or when the user signs out) */
export function resetConnectionManager(): void {
  instance?.destroy();
  instance = null;
}

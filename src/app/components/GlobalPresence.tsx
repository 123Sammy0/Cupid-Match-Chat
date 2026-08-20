"use client";

import type { User, Session } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { markConversationDelivered, markAllConversationsDelivered } from "@/app/actions/chat";
import { getConnectionManager, CONNECTION_STATE_EVENT, type ConnectionState } from "@/lib/realtime/ConnectionManager";

/**
 * GlobalPresence — App-wide presence + delivery tracking + connection state management.
 *
 * Mounted in the root layout. Responsibilities:
 * - Manage Supabase Presence channel (track/untrack user)
 * - Send heartbeat to /api/presence every 30s
 * - Handle visibility changes (background/foreground)
 * - Dispatch global_presence_sync events for other components
 * - Dispatch global_connection_state events via ConnectionManager
 * - Track message deliveries
 */
export default function GlobalPresence() {
  const channelRef = useRef<any>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }: { data: { user: User | null } }) => {
      if (data?.user) {
        setUserId(data.user.id);
        markAllConversationsDelivered().catch(console.error);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: Session | null) => {
      if (session?.user) {
        setUserId(session.user.id);
      } else {
        setUserId(null);
        if (event === 'SIGNED_OUT') {
          try {
            sessionStorage.clear();
            localStorage.clear();
          } catch (e) {}
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    const connManager = getConnectionManager();

    const setup = async () => {
      // Step 1: Set realtime auth BEFORE subscribing to any channels
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        await supabase.realtime.setAuth(session.access_token);
      }

      const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((_event: string, newSession: Session | null) => {
        if (newSession?.access_token) {
          supabase.realtime.setAuth(newSession.access_token);
        }
      });

      // --- Signal presence API: connect ---
      const connectionId = crypto.randomUUID();
      fetch('/api/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'connect', connectionId }),
      }).catch(() => {});

      // --- Global presence channel ---
      const existingPresence = supabase.getChannels().find((c: any) => c.topic === 'realtime:global_presence');
      if (existingPresence) supabase.removeChannel(existingPresence);

      const channel = supabase.channel('global_presence', {
        config: { presence: { key: userId } }
      });
      channelRef.current = channel;

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          if (typeof window !== 'undefined') {
            (window as any)._globalPresenceState = state;
            window.dispatchEvent(new CustomEvent('global_presence_sync', { detail: state }));
          }
        })
        .on('presence', { event: 'join' }, () => {
          const state = channel.presenceState();
          if (typeof window !== 'undefined') {
            (window as any)._globalPresenceState = state;
            window.dispatchEvent(new CustomEvent('global_presence_sync', { detail: state }));
          }
        })
        .on('presence', { event: 'leave' }, () => {
          const state = channel.presenceState();
          if (typeof window !== 'undefined') {
            (window as any)._globalPresenceState = state;
            window.dispatchEvent(new CustomEvent('global_presence_sync', { detail: state }));
          }
        })
        .subscribe(async (status: string, err?: Error) => {
          // Feed channel status into ConnectionManager
          connManager.handleChannelStatus(status, err);

          if (status === 'SUBSCRIBED') {
            await channel.track({ user_id: userId, online_at: new Date().toISOString() });
          }
        });

      // --- Delivery tracking channel ---
      const deliveryChannelName = `delivery:${userId}`;
      const existingDelivery = supabase.getChannels().find((c: any) => c.topic === `realtime:${deliveryChannelName}`);
      if (existingDelivery) supabase.removeChannel(existingDelivery);

      const deliveryChannel = supabase.channel(deliveryChannelName)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        }, (payload: any) => {
          if (payload.new.sender_id !== userId) {
            markConversationDelivered(payload.new.conversation_id).catch(console.error);
          }
        })
        .subscribe();

      // --- Heartbeat: every 30 seconds ---
      // Uses the proper /api/presence endpoint with 'heartbeat' action
      const sendHeartbeat = () => {
        fetch('/api/presence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'heartbeat' }),
        }).catch(() => {});
      };

      sendHeartbeat(); // Initial heartbeat
      const heartbeat = setInterval(sendHeartbeat, 30000);

      // --- Visibility / unload handlers ---
      const handleVisibility = () => {
        if (document.visibilityState === 'hidden') {
          // Going to background — signal disconnect
          fetch('/api/presence', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'disconnect' }),
            keepalive: true,
          }).catch(() => {});
        } else if (document.visibilityState === 'visible') {
          // Coming back to foreground — re-track + send connect
          fetch('/api/presence', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'connect', connectionId }),
          }).catch(() => {});

          if (channelRef.current) {
            channelRef.current.track({ user_id: userId, online_at: new Date().toISOString() }).catch(() => {});
          }
        }
      };

      const handleUnload = () => {
        fetch('/api/presence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'disconnect' }),
          keepalive: true,
        }).catch(() => {});
      };

      document.addEventListener('visibilitychange', handleVisibility);
      window.addEventListener('pagehide', handleUnload);
      window.addEventListener('beforeunload', handleUnload);

      return () => {
        clearInterval(heartbeat);
        authSub?.unsubscribe();
        document.removeEventListener('visibilitychange', handleVisibility);
        window.removeEventListener('pagehide', handleUnload);
        window.removeEventListener('beforeunload', handleUnload);
        // Final disconnect signal
        fetch('/api/presence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'disconnect' }),
          keepalive: true,
        }).catch(() => {});
        supabase.removeChannel(deliveryChannel);
      };
    };

    let isMounted = true;
    let cleanupFn: (() => void) | undefined;

    setup().then(fn => {
      if (isMounted) {
        cleanupFn = fn;
      } else {
        // Component unmounted before setup finished. Clean up immediately.
        fn();
      }
    });

    return () => {
      isMounted = false;
      cleanupFn?.();
    };
  }, [userId]);

  return null;
}

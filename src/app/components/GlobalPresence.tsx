"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateLastSeen, markConversationDelivered, markAllConversationsDelivered } from "@/app/actions/chat";

export default function GlobalPresence() {
  const channelRef = useRef<any>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUserId(data.user.id);
        markAllConversationsDelivered().catch(console.error);
      }
    });
  }, []);

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();

    // --- Global presence channel (presence only, no postgres_changes) ---
    // Keeping this channel CLEAN (only presence) prevents it from conflicting
    // with the room channel in ChatClient.tsx which handles postgres_changes.
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
      .on('presence', { event: 'join' }, ({ newPresences }: any) => {
        // Immediately re-fire sync on join so listeners catch new connections fast
        const state = channel.presenceState();
        if (typeof window !== 'undefined') {
          (window as any)._globalPresenceState = state;
          window.dispatchEvent(new CustomEvent('global_presence_sync', { detail: state }));
        }
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }: any) => {
        const state = channel.presenceState();
        if (typeof window !== 'undefined') {
          (window as any)._globalPresenceState = state;
          window.dispatchEvent(new CustomEvent('global_presence_sync', { detail: state }));
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: userId, online_at: new Date().toISOString() });
        }
      });

    // --- Separate channel for message delivery tracking ---
    // Isolated from presence so a failure in one doesn't break the other
    const deliveryChannel = supabase.channel(`delivery:${userId}`)
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

    // Update last_seen when user hides the tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        updateLastSeen().catch(console.error);
      }
    };

    // Periodically update last_seen (every 60 seconds while active)
    const interval = setInterval(() => {
      updateLastSeen().catch(console.error);
    }, 60 * 1000);

    const handleUnload = () => {
      updateLastSeen().catch(console.error);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handleUnload);
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handleUnload);
      window.removeEventListener('beforeunload', handleUnload);
      clearInterval(interval);
      updateLastSeen().catch(console.error);
      supabase.removeChannel(channel);
      supabase.removeChannel(deliveryChannel);
    };
  }, [userId]);

  return null;
}

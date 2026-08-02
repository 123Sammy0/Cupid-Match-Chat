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

    // Join the global presence channel
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
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, (payload: any) => {
        if (payload.new.sender_id !== userId) {
          markConversationDelivered(payload.new.conversation_id).catch(console.error);
        }
      })
      .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Track presence with a timestamp
        await channel.track({ user_id: userId, online_at: new Date().toISOString() });
      }
    });

    // Update last_seen in DB when the user leaves the page or hides it
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        updateLastSeen().catch(console.error);
      }
    };
    
    // Also periodically update last_seen while active (every 2 minutes)
    const interval = setInterval(() => {
      updateLastSeen().catch(console.error);
    }, 2 * 60 * 1000);

    const handleUnload = () => {
      // Best effort for when browser closes entirely
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
      // Update last seen one final time when component unmounts
      updateLastSeen().catch(console.error);
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return null;
}

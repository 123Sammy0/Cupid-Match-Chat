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
    const channel = supabase.channel('global_presence', {
      config: { presence: { key: userId } }
    });
    channelRef.current = channel;

    channel
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: userId, online_at: new Date().toISOString() });
        }
      });

    // --- Separate channel for message delivery tracking ---
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

    // Update last_seen immediately when tab becomes hidden or closed
    const handleLeave = () => {
      if (document.visibilityState === 'hidden') {
        updateLastSeen().catch(console.error);
      }
    };

    const handleUnload = () => {
      updateLastSeen().catch(console.error);
    };

    document.addEventListener('visibilitychange', handleLeave);
    window.addEventListener('pagehide', handleUnload);
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleLeave);
      window.removeEventListener('pagehide', handleUnload);
      window.removeEventListener('beforeunload', handleUnload);
      updateLastSeen().catch(console.error);
      // Clean up delivery tracking, but presence is shared globally so don't completely destroy it here 
      // since layout might be persisting it.
      supabase.removeChannel(deliveryChannel);
    };
  }, [userId]);

  return null;
}

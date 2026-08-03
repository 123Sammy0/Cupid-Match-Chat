'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

type Message = {
  id: string;
  sender_id: string;
  content: string;
  conversation_id: string;
  sent_at: string;
  seen_at: string | null;
  type?: string;
  expires_at?: string;
};

export default function ChatUI({ 
  conversationId, 
  currentUserId 
}: { 
  conversationId: string; 
  currentUserId: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const presenceChannelRef = useRef<RealtimeChannel | null>(null);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  // DIAGNOSTIC: Check if component unmounts unexpectedly during send
  useEffect(() => {
    console.log('ChatUI mounted');
    return () => console.log('ChatUI unmounted');
  }, []);

  // Periodic last_seen update for online/offline presence
  useEffect(() => {
    const updateLastSeen = async () => {
      await supabase
        .from('profiles')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', currentUserId);
    };

    updateLastSeen(); // Initial update on mount

    const interval = setInterval(() => {
      // Only ping if the tab is actively being used
      if (document.visibilityState === 'visible') {
        updateLastSeen();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [currentUserId, supabase]);

  // Mark unseen messages as seen (Batched Update)
  const markAsSeen = useCallback(async (unseenMessages: Message[]) => {
    const toMark = unseenMessages.filter(m => m.sender_id !== currentUserId && !m.seen_at);
    if (toMark.length === 0) return;

    const now = new Date().toISOString();
    
    // Optimistic UI update
    setMessages(prev => prev.map(m => 
      toMark.some(tm => tm.id === m.id) ? { ...m, seen_at: now } : m
    ));

    // Optimize: Batch database updates using `.in('id', ids)`
    const ids = toMark.map(m => m.id);
    const { error } = await supabase
      .from('messages')
      .update({ seen_at: now })
      .in('id', ids);

    if (error) {
      console.error('Failed to update read receipts:', error);
    }
  }, [currentUserId, supabase]);

  useEffect(() => {
    let isMounted = true;
    
    // 1. Fetch historical messages on mount
    const fetchHistory = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('sent_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }
      
      if (isMounted && data) {
        setMessages(prev => {
          const fetchedIds = new Set(data.map(m => m.id));
          const pendingOnly = prev.filter(m => !fetchedIds.has(m.id));
          const merged = [...data, ...pendingOnly];
          return merged.sort((a, b) => 
            new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
          );
        });
        markAsSeen(data);
      }
    };

    fetchHistory();

    // 2. Realtime subscription (postgres_changes filtered by conversation)
    const messageChannel = supabase
      .channel(`chat_messages_${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            // Prevent duplicates
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          
          if (newMsg.sender_id !== currentUserId) {
            markAsSeen([newMsg]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updatedMsg = payload.new as Message;
          setMessages((prev) => 
            prev.map(m => m.id === updatedMsg.id ? updatedMsg : m)
          );
        }
      );

    // 3. Supabase Presence for typing indicator
    const presenceChannel = supabase.channel(`chat_presence_${conversationId}`, {
      config: { presence: { key: currentUserId } },
    });
    
    presenceChannelRef.current = presenceChannel;

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const typing: string[] = [];
        
        for (const [key, presences] of Object.entries(state)) {
          if (key !== currentUserId && (presences as any[]).some(p => p.isTyping)) {
            typing.push(key);
          }
        }
        setTypingUsers(typing);
      });

    messageChannel.subscribe();
    presenceChannel.subscribe();

    return () => {
      isMounted = false;
      messageChannel.unsubscribe();
      presenceChannel.unsubscribe();
      presenceChannelRef.current = null;
    };
  }, [conversationId, currentUserId, supabase, markAsSeen]);

  const handleTyping = async () => {
    if (!presenceChannelRef.current) return;
    
    await presenceChannelRef.current.track({ isTyping: true });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(async () => {
      if (presenceChannelRef.current) {
        await presenceChannelRef.current.track({ isTyping: false });
      }
    }, 2000);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const content = newMessage.trim();
    setNewMessage('');
    
    // Clear typing state instantly using the reused channel
    if (presenceChannelRef.current) {
      presenceChannelRef.current.track({ isTyping: false });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    const msgId = crypto.randomUUID();
    const clientTimeNow = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Optimistic insert with placeholder client time
    const optimisticMsg: Message = {
      id: msgId,
      conversation_id: conversationId,
      sender_id: currentUserId,
      content,
      type: 'text',
      sent_at: clientTimeNow,
      seen_at: null,
      expires_at: expiresAt
    };
    console.time('optimistic-render');
    setMessages(prev => [...prev, optimisticMsg]);
    console.timeEnd('optimistic-render'); // should be near-instant (<10ms)

    console.time('db-insert');
    // Fast insert using supabase-js client (letting DB set sent_at default now())
    const { data, error } = await supabase
      .from('messages')
      .insert({
        id: msgId,
        conversation_id: conversationId,
        sender_id: currentUserId,
        content,
        type: 'text',
        expires_at: expiresAt
      })
      .select()
      .single();
    console.timeEnd('db-insert');

    if (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on failure
      setMessages(prev => prev.filter(m => m.id !== msgId));
    } else if (data) {
      // Replace optimistic message with authoritative DB row (fixes clock skew)
      setMessages(prev => prev.map(m => (m.id === msgId ? (data as Message) : m)));
    }
  };

  return (
    <div className="flex flex-col h-[500px] w-full max-w-md bg-gray-50 border border-gray-200 rounded-xl overflow-hidden shadow-sm font-sans relative">
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-gray-200 flex items-center shadow-sm z-10">
        <div className="font-semibold text-gray-800">Chat</div>
      </div>
      
      {/* Messages Viewport */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isMine = msg.sender_id === currentUserId;
          return (
            <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
              <div 
                className={`px-4 py-2 rounded-2xl max-w-[85%] break-words shadow-sm ${
                  isMine 
                    ? 'bg-[#10B981] text-white rounded-br-sm' 
                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'
                }`}
              >
                <p className="text-[15px] leading-relaxed">{msg.content}</p>
                <div 
                  className={`text-[10px] mt-1 text-right flex items-center justify-end gap-1 ${
                    isMine ? 'text-green-100' : 'text-gray-400'
                  }`}
                >
                  {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {isMine && (
                    <span className="ml-1 tracking-tighter font-bold">
                      {msg.seen_at ? <span className="text-blue-200">✓✓</span> : '✓'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        {typingUsers.length > 0 && (
          <div className="text-xs text-gray-500 italic px-2 animate-pulse">
            typing...
          </div>
        )}
        <div ref={messagesEndRef} className="h-1" />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white border-t border-gray-200">
        <form onSubmit={handleSend} className="flex gap-2 items-end">
          <textarea
            className="flex-1 min-h-[40px] max-h-[120px] px-4 py-2 border border-gray-300 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent resize-none leading-relaxed text-gray-800 bg-gray-50 placeholder-gray-400"
            placeholder="Message..."
            value={newMessage}
            rows={1}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
              // Auto-expand textarea
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e as any);
              }
            }}
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="h-[40px] px-5 bg-[#10B981] hover:bg-[#0EA5E9] text-white rounded-full text-sm font-semibold disabled:opacity-50 disabled:hover:bg-[#10B981] transition-colors flex-shrink-0 shadow-sm"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

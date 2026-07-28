"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function ChatClient({ conversationId, user, profile, otherUser }: { conversationId: string, user: any, profile: any, otherUser: any }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserOnline, setOtherUserOnline] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const supabase = createClient();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 1. Fetch existing messages
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*, profiles(username)')
        .eq('conversation_id', conversationId)
        .order('sent_at', { ascending: true });
      
      if (data) setMessages(data);
    };
    fetchMessages();

    // 2. Subscribe to realtime changes (Messages)
    const channel = supabase.channel(`conversation:${conversationId}`);
    
    channel
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        supabase.from('profiles').select('username').eq('id', payload.new.sender_id).single()
          .then(({ data }) => {
            setMessages((prev) => [...prev, { ...payload.new, profiles: data }]);
          });
      })
      // Presence
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        let isOnline = false;
        let isT = false;
        
        Object.keys(state).forEach((key) => {
          const presences = state[key] as any[];
          presences.forEach(p => {
            if (p.user_id === otherUser?.id) {
              isOnline = true;
              if (p.typing) isT = true;
            }
          });
        });

        setOtherUserOnline(isOnline);
        setOtherUserTyping(isT);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
            typing: isTyping
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, supabase, user.id, otherUser?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, otherUserTyping]);

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (!isTyping) {
      setIsTyping(true);
      supabase.channel(`conversation:${conversationId}`).track({ user_id: user.id, typing: true });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      supabase.channel(`conversation:${conversationId}`).track({ user_id: user.id, typing: false });
    }, 1500);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    const content = newMessage;
    setNewMessage(""); // optimistically clear
    setIsTyping(false);
    supabase.channel(`conversation:${conversationId}`).track({ user_id: user.id, typing: false });

    // Expires in 4 hours
    const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();

    await supabase.from('messages').insert({
      sender_id: user.id,
      conversation_id: conversationId,
      content,
      type: 'text',
      expires_at: expiresAt
    });
  };

  return (
    <>
      <header className="flex items-center justify-between p-4 bg-white/90 backdrop-blur-md text-black z-10 border-b border-gray-100">
        <button onClick={() => router.push('/room')} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-black transition-colors" aria-label="Back">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>

        <div className="flex-1 flex flex-col items-center ml-2">
          <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold text-lg mb-1 relative">
            {otherUser?.username?.charAt(0).toUpperCase() || '?'}
            {otherUserOnline && <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>}
          </div>
          <p className="font-bold text-base text-black leading-tight">{otherUser?.username || 'Unknown'}</p>
          <span className="text-[10px] text-gray-400 font-medium tracking-wide uppercase">
            {otherUserOnline ? 'Active now' : (otherUser?.last_seen ? 'Offline' : 'Offline')}
          </span>
        </div>

        <button className="p-2 -mr-2 rounded-full hover:bg-gray-100 text-black transition-colors" aria-label="More">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>
          </svg>
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-[#FAF6EE]">
        {messages.map((m, idx) => {
          const isMine = m.sender_id === user.id;
          const showTime = idx === messages.length - 1 || new Date(messages[idx+1].sent_at).getTime() - new Date(m.sent_at).getTime() > 5 * 60 * 1000;
          
          return (
            <div key={m.id} className={`flex flex-col max-w-[75%] ${isMine ? 'self-end items-end' : 'self-start items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className={`p-3.5 rounded-2xl shadow-sm text-[15px] leading-relaxed ${isMine ? 'bg-black text-white rounded-br-[4px]' : 'bg-white text-black rounded-bl-[4px] border border-gray-100'}`}>
                {m.content}
              </div>
              {showTime && (
                <div className="flex items-center gap-1 mt-1 px-1">
                  <span className="text-[10px] text-gray-400 font-medium">
                    {new Date(m.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {isMine && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                      <path d="M18 6 7 17l-5-5"/><path d="m22 10-7.5 7.5L13 16"/>
                    </svg>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {otherUserTyping && (
          <div className="flex flex-col max-w-[75%] self-start items-start animate-in fade-in">
            <div className="p-4 rounded-2xl bg-white text-black rounded-bl-[4px] border border-gray-100 shadow-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <div className="p-3 bg-white border-t border-gray-100 flex gap-2 items-end">
        <button type="button" className="p-3 text-gray-400 hover:text-black transition-colors rounded-full hover:bg-gray-50" aria-label="Attachment placeholder">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
        </button>

        <form onSubmit={handleSend} className="flex-1 relative bg-gray-100 rounded-3xl flex items-end">
          <input 
            type="text" 
            value={newMessage}
            onChange={handleTyping}
            placeholder="Message..." 
            className="w-full bg-transparent py-3.5 px-4 focus:outline-none text-black placeholder-gray-500" 
          />
          <button type="button" className="p-3.5 text-gray-400 hover:text-black transition-colors" aria-label="Emoji placeholder">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/></svg>
          </button>
        </form>

        <button 
          onClick={handleSend}
          disabled={!newMessage.trim()}
          className="p-3.5 bg-black text-white rounded-full hover:bg-gray-800 transition-all disabled:opacity-50 disabled:hover:bg-black"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m22 2-7 20-4-9-9-4 20-7z"/><path d="M22 2 11 13"/>
          </svg>
        </button>
      </div>
    </>
  );
}

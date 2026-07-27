"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function ChatClient({ roomCode, user, profile }: { roomCode: string, user: any, profile: any }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const supabase = createClient();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Fetch existing messages
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*, profiles(username)')
        .eq('room_code', roomCode)
        .order('sent_at', { ascending: true });
      
      if (data) setMessages(data);
    };
    fetchMessages();

    // 2. Subscribe to realtime changes
    const channel = supabase.channel(`room:${roomCode}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `room_code=eq.${roomCode}`
      }, (payload) => {
        // Fetch the profile for the new message to get the username
        supabase.from('profiles').select('username').eq('id', payload.new.sender_id).single()
          .then(({ data }) => {
            setMessages((prev) => [...prev, { ...payload.new, profiles: data }]);
          });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomCode, supabase]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    const content = newMessage;
    setNewMessage(""); // optimistically clear

    // Expires in 4 hours
    const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();

    await supabase.from('messages').insert({
      sender_id: user.id,
      room_code: roomCode,
      content,
      type: 'text',
      expires_at: expiresAt
    });
  };

  return (
    <section className="flex flex-col h-full max-w-3xl mx-auto w-full bg-white shadow-xl relative">
      <header className="flex items-center justify-between p-4 border-b bg-[#FAF6EE]">
        <button onClick={() => router.push('/room')} className="p-2 rounded-full hover:bg-black/5" aria-label="Back to rooms">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>

        <div className="text-center">
          <p className="font-semibold text-lg">{roomCode}</p>
          <span className="text-xs text-green-600 flex items-center justify-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500"></span> active now
          </span>
        </div>

        <div className="flex gap-2">
           <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold">
             {profile?.username?.charAt(0).toUpperCase()}
           </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-white/50">
        {messages.map((m) => {
          const isMine = m.sender_id === user.id;
          return (
            <div key={m.id} className={`flex flex-col max-w-[75%] ${isMine ? 'self-end items-end' : 'self-start items-start'}`}>
              <span className="text-xs text-gray-400 mb-1 px-1">{m.profiles?.username}</span>
              <div className={`p-3 rounded-2xl ${isMine ? 'bg-black text-white rounded-tr-none' : 'bg-gray-100 text-black rounded-tl-none'}`}>
                {m.content}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t flex gap-2 items-center">
        <button type="button" className="p-2 text-gray-500 hover:text-black">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/>
          </svg>
        </button>

        <div className="flex-1 relative">
          <input 
            type="text" 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Write something…" 
            className="w-full bg-gray-100 rounded-full py-3 px-6 pr-12 focus:outline-none focus:ring-2 focus:ring-black/5" 
          />
        </div>

        <button type="submit" className="p-3 bg-black text-white rounded-full hover:bg-gray-800 transition">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m22 2-7 20-4-9-9-4 20-7z"/><path d="M22 2 11 13"/>
          </svg>
        </button>
      </form>
    </section>
  );
}

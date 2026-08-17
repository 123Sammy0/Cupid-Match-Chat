"use client";

import { useState, useEffect, useRef } from "react";
import { 
  getConversationMessages, 
  startTakeover, 
  endTakeover, 
  adminReply, 
  moderateMessage,
  getActiveTakeover
} from "@/app/actions/admin";

export default function ChatsClient({ initialConversations }: { initialConversations: any[] }) {
  const [selectedChat, setSelectedChat] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [takeoverActive, setTakeoverActive] = useState(false);
  const [replyText, setReplyText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMessages = async (chat: any) => {
    setSelectedChat(chat);
    setLoadingMsgs(true);
    setTakeoverActive(false);
    try {
      const msgs = await getConversationMessages(chat.id);
      setMessages(msgs);
      const takeover = await getActiveTakeover(chat.id);
      if (takeover) setTakeoverActive(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMsgs(false);
    }
  };

  const handleStartTakeover = async () => {
    if (!selectedChat) return;
    try {
      await startTakeover(selectedChat.id);
      setTakeoverActive(true);
    } catch (err) {
      alert("Failed to start takeover");
    }
  };

  const handleEndTakeover = async () => {
    if (!selectedChat) return;
    try {
      await endTakeover(selectedChat.id);
      setTakeoverActive(false);
    } catch (err) {
      alert("Failed to end takeover");
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedChat) return;
    
    // Default to the first participant for impersonation ID so it fits into the standard chat
    const impersonatedUserId = selectedChat.conversation_participants[0]?.profiles?.id;
    if (!impersonatedUserId) return;

    try {
      await adminReply(selectedChat.id, replyText, impersonatedUserId);
      setReplyText("");
      // Reload messages
      const msgs = await getConversationMessages(selectedChat.id);
      setMessages(msgs);
    } catch (err) {
      alert("Failed to reply: " + (err as Error).message);
    }
  };

  const handleModerate = async (msgId: string, action: 'delete' | 'redact') => {
    if (!confirm(`Are you sure you want to ${action} this message?`)) return;
    try {
      await moderateMessage(msgId, action);
      const msgs = await getConversationMessages(selectedChat!.id);
      setMessages(msgs);
    } catch (err) {
      alert("Failed to moderate message");
    }
  };

  return (
    <div className="flex h-full w-full bg-zinc-950 text-zinc-100 overflow-hidden rounded-xl border border-zinc-800">
      {/* Sidebar */}
      <div className="w-1/3 border-r border-zinc-800 flex flex-col bg-zinc-900/50">
        <div className="p-4 border-b border-zinc-800">
          <h2 className="text-lg font-semibold">Conversations</h2>
          <p className="text-sm text-zinc-400">Total: {initialConversations.length}</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {initialConversations.map((chat) => (
            <button
              key={chat.id}
              onClick={() => loadMessages(chat)}
              className={`w-full text-left p-4 border-b border-zinc-800/50 hover:bg-zinc-800 transition ${
                selectedChat?.id === chat.id ? "bg-zinc-800 border-l-2 border-l-blue-500" : ""
              }`}
            >
              <div className="text-sm font-medium truncate">
                {chat.conversation_participants.map((p: any) => p.profiles.username).join(", ")}
              </div>
              <div className="text-xs text-zinc-500 mt-1">
                {new Date(chat.created_at).toLocaleString()}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-zinc-950">
        {selectedChat ? (
          <>
            {/* Header */}
            <div className={`p-4 border-b border-zinc-800 flex justify-between items-center ${takeoverActive ? "bg-red-950/40" : ""}`}>
              <div>
                <h2 className="font-medium text-lg">
                  {selectedChat.conversation_participants.map((p: any) => p.profiles.username).join(" & ")}
                </h2>
                {takeoverActive && <span className="text-red-400 text-sm font-bold mt-1 block">TAKEOVER ACTIVE</span>}
              </div>
              <div>
                {takeoverActive ? (
                  <button onClick={handleEndTakeover} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                    End Takeover
                  </button>
                ) : (
                  <button onClick={handleStartTakeover} className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition border border-zinc-700">
                    Start Takeover
                  </button>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadingMsgs ? (
                <div className="text-center text-zinc-500">Loading...</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-zinc-500 mt-10">No messages yet.</div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className="group relative flex flex-col">
                    <div className="flex items-end gap-2">
                      <div className="bg-zinc-800 text-white px-4 py-2 rounded-xl rounded-tl-sm max-w-[80%] relative">
                        {msg.metadata?.is_admin_reply && (
                          <div className="absolute -top-3 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                            ADMIN
                          </div>
                        )}
                        {msg.is_deleted ? (
                          <span className="italic text-zinc-500">This message was deleted.</span>
                        ) : (
                          <span>{msg.content}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-zinc-500 mt-1 flex items-center gap-2">
                      <span className="font-medium text-zinc-400">{msg.profiles?.username}</span>
                      <span>{new Date(msg.sent_at).toLocaleTimeString()}</span>
                      
                      {/* Moderation Controls on Hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 ml-4">
                        {!msg.is_deleted && (
                          <>
                            <button onClick={() => handleModerate(msg.id, 'redact')} className="text-orange-400 hover:text-orange-300 transition">Redact</button>
                            <button onClick={() => handleModerate(msg.id, 'delete')} className="text-red-400 hover:text-red-300 transition">Delete</button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar (Only during Takeover) */}
            {takeoverActive && (
              <div className="p-4 border-t border-red-900/50 bg-zinc-900">
                <form onSubmit={handleReply} className="flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type as Admin..."
                    className="flex-1 bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim()}
                    className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-medium px-6 py-3 rounded-lg transition"
                  >
                    Send
                  </button>
                </form>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-500 flex-col gap-4">
            <svg className="w-16 h-16 opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <p>Select a conversation to start monitoring.</p>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getConversations, getPendingRequests, acceptChatRequest, rejectChatRequest, deleteConversation } from "@/app/actions/chat";
import NewChatModal from "@/components/NewChatModal";
import { createClient } from "@/lib/supabase/client";
import AvatarImage from "@/app/components/AvatarImage";

export default function ChatHome() {
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [longPressId, setLongPressId] = useState<string | null>(null);
  const [tappedConvId, setTappedConvId] = useState<string | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const loadData = async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
    }
    try {
      const [convs, reqs] = await Promise.all([
        getConversations(),
        getPendingRequests()
      ]);
      setConversations(convs);
      setPendingRequests(reqs);
      try {
        sessionStorage.setItem("cupid_cache_conversations", JSON.stringify(convs));
        sessionStorage.setItem("cupid_cache_pending_requests", JSON.stringify(reqs));
      } catch (e) {}
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let hasCachedData = false;
    try {
      const cachedConvs = sessionStorage.getItem("cupid_cache_conversations");
      const cachedReqs = sessionStorage.getItem("cupid_cache_pending_requests");
      if (cachedConvs) {
        const parsedConvs = JSON.parse(cachedConvs);
        setConversations(parsedConvs);
        hasCachedData = true;
      }
      if (cachedReqs) {
        const parsedReqs = JSON.parse(cachedReqs);
        setPendingRequests(parsedReqs);
      }
      if (hasCachedData) {
        setIsLoading(false);
      }
    } catch (e) {}

    loadData(hasCachedData);
    
    const supabase = createClient();
    const existingChannel = supabase.getChannels().find((c: any) => c.topic === 'realtime:home_realtime');
    if (existingChannel) supabase.removeChannel(existingChannel);

    const channel = supabase
      .channel('home_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        loadData(true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversation_participants' }, () => {
        loadData(true);
      });
    
    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    conversations.forEach(conv => {
      if (conv?.id) {
        try {
          router.prefetch(`/room/${conv.id}`);
        } catch (e) {}
      }
    });
  }, [conversations, router]);

  const handleAcceptRequest = async (id: string) => {
    const res = await acceptChatRequest(id);
    if (res.success) {
      loadData();
    }
  };

  const handleRejectRequest = async (id: string) => {
    const res = await rejectChatRequest(id);
    if (res.success) {
      setPendingRequests(prev => prev.filter(r => r.id !== id));
    }
  };

  const handleDeleteConversation = async (convId: string) => {
    setLongPressId(null);
    if (!confirm("Delete this conversation? It will be removed from your list.")) return;
    const res = await deleteConversation(convId);
    if (res.success) {
      setConversations(prev => prev.filter(c => c.id !== convId));
    }
  };

  const startLongPress = (convId: string) => {
    longPressTimerRef.current = setTimeout(() => {
      setLongPressId(convId);
    }, 500);
  };

  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const getLastMessagePreview = (conv: any) => {
    if (!conv.last_message) return "Tap to open conversation...";
    const lm = conv.last_message;
    
    if (lm.is_deleted) {
      return "🚫 This message was deleted";
    }

    const isMe = lm.sender_id !== conv.other_user_id;
    const prefix = isMe ? "You: " : "";
    
    if (lm.type === 'image') return prefix + "📷 Photo";
    if (lm.type === 'video') return prefix + "🎥 Video";
    if (lm.type === 'audio') return prefix + "🎵 Audio";
    if (lm.type === 'document') {
      try {
        const parsed = JSON.parse(lm.content);
        return prefix + "📎 " + (parsed.name || 'File');
      } catch { return prefix + "📎 File"; }
    }
    
    // Try to parse JSON content (reply or media)
    try {
      if (lm.content.startsWith('{')) {
        const parsed = JSON.parse(lm.content);
        if (parsed.replyTo) return prefix + parsed.text;
        if (parsed.type === 'image') return prefix + "📷 Photo";
        if (parsed.type === 'video') return prefix + "🎥 Video";
        if (parsed.type === 'audio') return prefix + "🎵 Audio";
        return prefix + lm.content;
      }
    } catch {}
    
    return prefix + lm.content;
  };

  return (
    <div className="flex h-[100dvh] w-full items-center justify-center bg-white text-black font-sans selection:bg-black selection:text-white sm:p-4">
      <section className="bg-white shadow-[0_8px_40px_rgb(0,0,0,0.06)] relative w-full max-w-[450px] h-full sm:h-[92vh] sm:rounded-[40px] overflow-hidden flex flex-col border border-gray-100">
        
        {/* Top Bar */}
        <header className="px-6 pt-10 pb-4 bg-white/90 backdrop-blur-xl sticky top-0 z-10 border-b border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-black text-white rounded-xl flex items-center justify-center font-serif text-xl shadow-inner">
                ✦
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-black">Messages</h1>
            </div>
            <button 
              onClick={() => router.push('/settings')} 
              className="p-2.5 -mr-2 text-gray-400 hover:text-black transition-all rounded-full hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-black/20 active:scale-90 active:bg-slate-200 select-none cursor-pointer" 
              aria-label="Settings"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
          </div>
          
          <div className="relative group">
            <input 
              type="text" 
              placeholder="Search conversations..." 
              className="w-full bg-slate-100/60 text-black font-medium rounded-2xl py-3 pl-11 pr-4 focus:outline-none focus:ring-4 focus:ring-black/5 focus:bg-white border border-transparent focus:border-black/20 transition-all placeholder-gray-400"
            />
            <svg className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-black transition-colors" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 pb-24 pt-2">
          
          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <div className="mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-3">Requests ({pendingRequests.length})</h3>
              <div className="space-y-3">
                {pendingRequests.map(req => (
                  <div key={req.id} className="p-4 bg-white rounded-[24px] border border-gray-100 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center font-bold text-2xl shadow-sm overflow-hidden">
                        <AvatarImage url={req.profiles?.avatar_url} username={req.profiles?.username} />
                      </div>
                      <div>
                        <p className="font-semibold text-[15px] text-black">{req.profiles?.username}</p>
                        <p className="text-xs text-gray-500 font-medium">Wants to connect</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleRejectRequest(req.id)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-gray-400 hover:text-black hover:bg-gray-50 border border-gray-100 hover:border-gray-200 transition-all focus:outline-none focus:ring-2 focus:ring-gray-200">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                      </button>
                      <button onClick={() => handleAcceptRequest(req.id)} className="w-10 h-10 flex items-center justify-center rounded-full bg-black text-white hover:bg-gray-900 shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-black/30 active:scale-95">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conversation List */}
          <div>
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-2">Recent</h3>
            
            {isLoading ? (
              <div className="px-2 py-8 text-center flex flex-col items-center justify-center gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-black animate-spin"></div>
                <span className="text-sm text-gray-400 font-medium">Loading messages...</span>
              </div>
            ) : conversations.length === 0 ? (
              <div className="px-2 py-12 text-center flex flex-col items-center justify-center animate-in fade-in duration-700">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-5 shadow-inner">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-black opacity-70"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
                <p className="text-gray-800 font-semibold text-lg">No conversations yet</p>
                <p className="text-gray-400 text-sm mt-1 max-w-[200px] leading-relaxed">Tap the new chat button below to start connecting.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {conversations.map(conv => (
                  <div 
                    key={conv.id} 
                    onClick={() => {
                      if (!longPressId) {
                        setTappedConvId(conv.id);
                        try {
                          if (conv.other_user) {
                            sessionStorage.setItem(`cupid_other_user_${conv.id}`, JSON.stringify(conv.other_user));
                          }
                        } catch (e) {}
                        router.push(`/room/${conv.id}`);
                      }
                    }}
                    onMouseEnter={() => { try { router.prefetch(`/room/${conv.id}`); } catch (e) {} }}
                    onTouchStart={() => {
                      startLongPress(conv.id);
                      try { router.prefetch(`/room/${conv.id}`); } catch (e) {}
                    }}
                    onTouchEnd={cancelLongPress}
                    onTouchMove={cancelLongPress}
                    onContextMenu={(e) => { e.preventDefault(); setLongPressId(conv.id); }}
                    className={`flex items-center gap-4 p-3 rounded-2xl cursor-pointer select-none transition-all duration-150 group relative animate-in fade-in slide-in-from-bottom-2 active:scale-[0.97] active:bg-slate-200/90 ${tappedConvId === conv.id ? 'bg-slate-200/90 scale-[0.98] shadow-inner border border-black/10' : longPressId === conv.id ? 'bg-slate-100' : 'hover:bg-slate-100'}`}
                  >
                    <div className="relative">
                      <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center font-bold text-2xl shadow-sm relative overflow-hidden">
                        <AvatarImage url={conv.other_user?.avatar_url} username={conv.other_user?.username} />
                      </div>
                      {/* Online dot */}
                      {conv.other_user?.last_seen && (Date.now() - new Date(conv.other_user.last_seen).getTime() < 150000) && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full z-10"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex justify-between items-center mb-0.5">
                        <h4 className={`font-bold text-[16px] truncate ${conv.unread_count > 0 ? 'text-black' : 'text-gray-900'}`}>{conv.other_user?.username}</h4>
                        <span className={`text-[11px] font-semibold whitespace-nowrap ${conv.unread_count > 0 ? 'text-black' : 'text-gray-400'}`}>
                          {new Date(conv.last_message?.sent_at || conv.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className={`text-[14px] truncate flex-1 mr-2 ${conv.unread_count > 0 ? 'text-black font-semibold' : 'text-gray-500 font-medium'}`}>
                          {getLastMessagePreview(conv)}
                        </p>
                        {tappedConvId === conv.id ? (
                          <span className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 bg-black/5 text-black rounded-full text-xs font-bold animate-pulse">
                            <span className="w-3 h-3 rounded-full border-2 border-black border-t-transparent animate-spin"></span>
                            Opening...
                          </span>
                        ) : conv.unread_count > 0 && (
                          <span className="flex-shrink-0 min-w-[20px] h-[20px] px-1.5 bg-black text-white text-[11px] font-bold rounded-full flex items-center justify-center">
                            {conv.unread_count > 99 ? '99+' : conv.unread_count}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Long Press Delete Menu */}
                    {longPressId === conv.id && (
                      <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-2xl flex items-center justify-center gap-3 z-10 animate-in fade-in duration-150">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteConversation(conv.id); }}
                          className="px-4 py-2 bg-red-500 text-white text-sm font-bold rounded-xl hover:bg-red-600 transition-colors"
                        >
                          Delete
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setLongPressId(null); }}
                          className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-300 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Home Button */}
        <button 
          onClick={() => router.push('/')}
          className="absolute bottom-8 left-6 w-14 h-14 bg-black text-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:bg-gray-900 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-150 z-20 focus:outline-none focus:ring-4 focus:ring-black/30 select-none cursor-pointer"
          aria-label="Home"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </button>

        {/* Floating Action Button */}
        <button 
          onClick={() => setShowNewChat(true)}
          className="absolute bottom-8 right-6 w-14 h-14 bg-black text-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:bg-gray-900 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-150 z-20 focus:outline-none focus:ring-4 focus:ring-black/30 select-none cursor-pointer"
          aria-label="New chat"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
        </button>

      </section>

      {/* New Chat Modal overlay */}
      {showNewChat && <NewChatModal onClose={() => setShowNewChat(false)} onChatCreated={loadData} />}
    </div>
  );
}

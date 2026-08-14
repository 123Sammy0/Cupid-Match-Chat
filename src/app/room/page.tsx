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
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }

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
    <div className="flex h-[100dvh] w-full items-center justify-center bg-base text-text-main font-sans selection:bg-accent selection:text-text-main sm:p-4">
      <section className="bg-surface shadow-[0_8px_40px_rgb(74,63,68,0.06)] relative w-full max-w-[450px] h-full sm:h-[92vh] sm:rounded-[40px] overflow-hidden flex flex-col border border-border-soft">
        
        {/* Top Bar */}
        <header className="px-6 pt-10 pb-4 bg-surface sticky top-0 z-10 border-b border-border-soft">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-surface text-text-main rounded-xl flex items-center justify-center font-serif text-xl shadow-inner border border-border-soft">
                ✦
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-text-main">Messages</h1>
            </div>
            <button className="w-10 h-10 rounded-full bg-surface hover:bg-border-soft text-text-sub hover:text-text-main flex items-center justify-center transition-colors focus:outline-none focus:ring-4 focus:ring-accent/30 active:scale-95 border border-border-soft shadow-sm"
                    onClick={() => router.push('/settings')}
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
              className="w-full bg-base text-text-main font-medium rounded-2xl py-3 pl-11 pr-4 focus:outline-none focus:ring-4 focus:ring-accent/20 focus:bg-white border border-border-soft focus:border-accent-alt transition-all placeholder-text-sub/70 shadow-sm"
            />
            <svg className="absolute left-4 top-3.5 text-text-sub group-focus-within:text-text-main transition-colors" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </div>
        </header>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto px-4 pb-28 pt-4 scrollbar-hide bg-surface relative">
          
          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <div className="mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-3">Requests ({pendingRequests.length})</h3>
              <div className="space-y-3">
                {pendingRequests.map(req => (
                  <div key={req.id} className="p-4 bg-surface rounded-[24px] border border-border-soft flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-accent text-text-main rounded-2xl flex items-center justify-center font-bold text-2xl shadow-sm overflow-hidden border border-border-soft">
                        <AvatarImage url={req.profiles?.avatar_url} username={req.profiles?.username} />
                      </div>
                      <div>
                        <p className="font-bold text-[15px] leading-none mb-1 text-text-main">{req.profiles?.username}</p>
                        <p className="text-[12px] text-text-sub font-medium">Wants to connect</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleRejectRequest(req.id)} className="w-10 h-10 flex items-center justify-center rounded-full bg-surface text-text-sub hover:text-text-main hover:bg-border-soft border border-border-soft transition-all focus:outline-none focus:ring-2 focus:ring-border-soft">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                      </button>
                      <button onClick={() => handleAcceptRequest(req.id)} className="w-10 h-10 flex items-center justify-center rounded-full bg-accent text-text-main hover:bg-accent/80 shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-accent/30 active:scale-95">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conversation List */}
          <div className="mb-4 mt-2">
            <h2 className="text-[11px] font-bold text-text-sub uppercase tracking-wider pl-2 mb-2">Recent</h2>
            
            {isLoading ? (
              <div className="px-2 py-8 text-center flex flex-col items-center justify-center gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-black animate-spin"></div>
                <span className="text-sm text-gray-400 font-medium">Loading messages...</span>
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-text-sub animate-in fade-in zoom-in duration-300 px-6 pt-12">
                <div className="w-20 h-20 bg-base rounded-full flex items-center justify-center mb-6 shadow-inner border border-border-soft">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-sub/50">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                  </svg>
                </div>
                <p className="font-bold text-[18px] text-text-main mb-2">No conversations yet</p>
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
                    className={`flex items-center gap-4 p-3 rounded-2xl cursor-pointer select-none transition-all duration-150 group relative animate-in fade-in slide-in-from-bottom-2 active:scale-[0.97] active:bg-base ${tappedConvId === conv.id ? 'bg-base scale-[0.98] shadow-inner border border-border-soft' : longPressId === conv.id ? 'bg-base' : 'hover:bg-base'}`}
                  >
                    <div className="relative">
                      <div className="w-12 h-12 bg-accent text-text-main rounded-full flex items-center justify-center font-bold text-2xl shadow-sm relative overflow-hidden border border-border-soft">
                        <AvatarImage url={conv.other_user?.avatar_url} username={conv.other_user?.username} />
                      </div>
                      {/* Online dot */}
                      {conv.other_user?.last_seen && (Date.now() - new Date(conv.other_user.last_seen).getTime() < 150000) && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-success border-2 border-surface rounded-full z-10"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h3 className={`font-bold text-[16px] truncate ${conv.unread_count > 0 ? 'text-text-main' : 'text-text-main/90'}`}>
                          {conv.other_user?.username || 'Unknown'}
                        </h3>
                        <span className={`text-[11px] font-medium whitespace-nowrap ml-2 ${conv.unread_count > 0 ? 'text-text-main font-bold' : 'text-text-sub'}`}>
                          {conv.last_message?.sent_at ? new Date(conv.last_message.sent_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-[14px] truncate leading-tight ${conv.unread_count > 0 ? 'text-text-main font-semibold' : 'text-text-sub'}`}>
                          {conv.last_message ? getLastMessagePreview(conv) : 'Tap to open conversation...'}
                        </p>
                        {tappedConvId === conv.id ? (
                          <span className="flex-shrink-0 min-w-[20px] h-[20px] px-1.5 bg-accent-alt text-text-main text-[11px] font-bold rounded-full flex items-center justify-center animate-pulse">
                            Opening...
                          </span>
                        ) : conv.unread_count > 0 && (
                          <span className="flex-shrink-0 min-w-[20px] h-[20px] px-1.5 bg-accent text-text-main text-[11px] font-bold rounded-full flex items-center justify-center">
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
          className="absolute bottom-8 left-6 w-14 h-14 bg-accent text-text-main rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(74,63,68,0.15)] hover:bg-accent/80 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-150 z-20 focus:outline-none focus:ring-4 focus:ring-accent/30 select-none cursor-pointer border border-border-soft"
          aria-label="Home"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </button>

        {/* Floating Action Button */}
        <button 
          onClick={() => setShowNewChat(true)}
          className="absolute bottom-8 right-6 w-14 h-14 bg-accent text-text-main rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(74,63,68,0.15)] hover:bg-accent/80 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-150 z-20 focus:outline-none focus:ring-4 focus:ring-accent/30 select-none cursor-pointer border border-border-soft"
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

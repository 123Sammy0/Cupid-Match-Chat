"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getConversations, getPendingRequests, acceptChatRequest, rejectChatRequest } from "@/app/actions/chat";
import NewChatModal from "@/components/NewChatModal";
import { createClient } from "@/lib/supabase/client";

export default function ChatHome() {
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    const [convs, reqs] = await Promise.all([
      getConversations(),
      getPendingRequests()
    ]);
    setConversations(convs);
    setPendingRequests(reqs);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
    
    const supabase = createClient();
    const channel = supabase
      .channel('home_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversation_participants' }, () => {
        loadData();
      });
    
    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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

  return (
    <div className="flex h-screen w-full items-center justify-center bg-white text-[#3A2034] font-sans selection:bg-[#D97A89] selection:text-white sm:p-4">
      <section className="bg-white shadow-[0_8px_40px_rgb(0,0,0,0.06)] relative w-full max-w-[450px] h-full sm:h-[92vh] sm:rounded-[40px] overflow-hidden flex flex-col border border-[#EEE7F7]/60">
        
        {/* Top Bar */}
        <header className="px-6 pt-10 pb-4 bg-white/90 backdrop-blur-xl sticky top-0 z-10 border-b border-[#EEE7F7]/40">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-slate-100 text-[#D97A89] rounded-xl flex items-center justify-center font-serif text-xl shadow-inner">
                ✦
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-[#3A2034]">Messages</h1>
            </div>
            <button 
              onClick={() => router.push('/settings')} 
              className="p-2.5 -mr-2 text-gray-400 hover:text-[#3A2034] transition-colors rounded-full hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#D97A89]/20" 
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
              className="w-full bg-slate-100/60 text-[#3A2034] font-medium rounded-2xl py-3 pl-11 pr-4 focus:outline-none focus:ring-4 focus:ring-[#D97A89]/10 focus:bg-white border border-transparent focus:border-[#D97A89]/30 transition-all placeholder-gray-400"
            />
            <svg className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-[#D97A89] transition-colors" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
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
                  <div key={req.id} className="p-4 bg-white rounded-[24px] border border-[#D97A89]/10 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-100 text-[#3A2034] rounded-2xl flex items-center justify-center font-bold text-2xl shadow-sm">
                        {req.profiles?.avatar_url ? req.profiles.avatar_url : req.profiles?.username?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-[15px]">{req.profiles?.username}</p>
                        <p className="text-xs text-gray-500 font-medium">Wants to connect</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleRejectRequest(req.id)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-gray-400 hover:text-red-500 hover:bg-red-50 border border-gray-100 hover:border-red-100 transition-all focus:outline-none focus:ring-2 focus:ring-red-200">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                      </button>
                      <button onClick={() => handleAcceptRequest(req.id)} className="w-10 h-10 flex items-center justify-center rounded-full bg-[#3A2034] text-white hover:bg-[#261522] shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#3A2034]/30 active:scale-95">
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
                <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-[#D97A89] animate-spin"></div>
                <span className="text-sm text-gray-400 font-medium">Loading messages...</span>
              </div>
            ) : conversations.length === 0 ? (
              <div className="px-2 py-12 text-center flex flex-col items-center justify-center animate-in fade-in duration-700">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-5 shadow-inner">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-[#D97A89] opacity-70"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
                <p className="text-gray-800 font-semibold text-lg">No conversations yet</p>
                <p className="text-gray-400 text-sm mt-1 max-w-[200px] leading-relaxed">Tap the new chat button below to start connecting.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {conversations.map(conv => (
                  <div 
                    key={conv.id} 
                    onClick={() => router.push(`/room/${conv.id}`)}
                    className="flex items-center gap-4 p-3 hover:bg-slate-100 rounded-2xl cursor-pointer transition-colors group relative animate-in fade-in slide-in-from-bottom-2"
                  >
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-tr from-[#3A2034] to-[#5a3652] text-white rounded-[18px] flex items-center justify-center font-bold text-2xl shadow-sm relative">
                        {conv.other_user?.avatar_url ? conv.other_user.avatar_url : conv.other_user?.username?.charAt(0).toUpperCase() || '?'}
                        {/* Online dot */}
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#5E9C7D] border-2 border-white rounded-full"></div>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex justify-between items-center mb-0.5">
                        <h4 className="font-bold text-[16px] text-gray-900 truncate">{conv.other_user?.username}</h4>
                        <span className="text-[11px] text-gray-400 font-semibold whitespace-nowrap">
                          {new Date(conv.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[14px] text-gray-500 truncate font-medium">Tap to open conversation...</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Floating Action Button */}
        <button 
          onClick={() => setShowNewChat(true)}
          className="absolute bottom-8 right-6 w-14 h-14 bg-[#3A2034] text-white rounded-[20px] flex items-center justify-center shadow-[0_8px_30px_rgb(58,32,52,0.3)] hover:bg-[#261522] hover:-translate-y-0.5 active:translate-y-0 transition-all z-20 focus:outline-none focus:ring-4 focus:ring-[#3A2034]/30"
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

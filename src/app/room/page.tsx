"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getConversations, getPendingRequests, acceptChatRequest, rejectChatRequest } from "@/app/actions/chat";
import NewChatModal from "@/components/NewChatModal";

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
    // Ideally we would set up a realtime subscription here for new requests and messages
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
    <div className="flex h-screen w-full items-center justify-center bg-[#FAF6EE] text-black">
      <section className="bg-white shadow-xl relative w-full max-w-[450px] h-full sm:h-[90vh] sm:rounded-[32px] overflow-hidden flex flex-col border border-gray-100">
        
        {/* Top Bar */}
        <header className="px-6 pt-8 pb-4 bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center font-bold">✦</span>
              <h1 className="text-xl font-bold tracking-tight">Messages</h1>
            </div>
            <button onClick={() => router.push('/settings')} className="p-2 -mr-2 text-gray-400 hover:text-black transition-colors rounded-full hover:bg-gray-100" aria-label="Settings">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </button>
          </div>
          
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search conversations..." 
              className="w-full bg-gray-100 text-black rounded-2xl py-3 px-10 focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
            />
            <svg className="absolute left-3.5 top-3.5 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 pb-24">
          
          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2 mb-3">Requests ({pendingRequests.length})</h3>
              <div className="space-y-2">
                {pendingRequests.map(req => (
                  <div key={req.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-bold">
                        {req.profiles?.username?.charAt(0).toUpperCase()}
                      </div>
                      <p className="font-semibold">{req.profiles?.username}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleRejectRequest(req.id)} className="w-8 h-8 flex items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                      </button>
                      <button onClick={() => handleAcceptRequest(req.id)} className="w-8 h-8 flex items-center justify-center rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conversation List */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2 mb-2">Recent</h3>
            
            {isLoading ? (
              <div className="px-2 py-4 text-center text-sm text-gray-400 animate-pulse">Loading...</div>
            ) : conversations.length === 0 ? (
              <div className="px-2 py-10 text-center opacity-50 flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-gray-400"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
                <p className="text-gray-500 font-medium">No conversations yet.</p>
                <p className="text-gray-400 text-sm mt-1">Tap + to start a new chat.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {conversations.map(conv => (
                  <div 
                    key={conv.id} 
                    onClick={() => router.push(`/room/${conv.id}`)}
                    className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-2xl cursor-pointer transition-colors group relative"
                  >
                    <div className="relative">
                      <div className="w-14 h-14 bg-black text-white rounded-[20px] flex items-center justify-center font-bold text-xl shadow-sm group-hover:scale-105 transition-transform">
                        {conv.other_user?.username?.charAt(0).toUpperCase()}
                      </div>
                      {/* Online dot placeholder */}
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-bold text-base truncate pr-2">{conv.other_user?.username}</h4>
                        <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
                          {new Date(conv.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate font-medium">Tap to open conversation...</p>
                    </div>

                    {/* Unread Badge placeholder (Logic will be tied to messages) */}
                    {/* <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center">
                      <span className="text-[10px] font-bold text-white">2</span>
                    </div> */}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Floating Action Button */}
        <button 
          onClick={() => setShowNewChat(true)}
          className="absolute bottom-8 right-6 w-14 h-14 bg-black text-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:bg-gray-800 transition-all hover:scale-105 active:scale-95 z-20"
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

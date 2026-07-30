"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { searchUsers, createDirectConversation } from "@/app/actions/chat";

export default function NewChatModal({ onClose, onChatCreated }: { onClose: () => void, onChatCreated: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [requestSentTo, setRequestSentTo] = useState<string | null>(null);

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (query.length >= 2) {
        setIsSearching(true);
        const users = await searchUsers(query);
        setResults(users);
        setIsSearching(false);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [query]);

  const handleSendRequest = async (userId: string) => {
    setRequestSentTo(userId); // Show loading state on button
    const res = await createDirectConversation(userId);
    if (res.success && res.conversationId) {
      onChatCreated();
      onClose();
      router.push(`/room/${res.conversationId}`);
    } else {
      setRequestSentTo(null);
      alert(res.message); // In a real app, use toast
    }
  };

  return (
    <div className="fixed inset-0 bg-[#3A2034]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-[32px] shadow-[0_8px_40px_rgb(0,0,0,0.12)] border border-[#EEE7F7]/60 overflow-hidden flex flex-col h-[500px] animate-in zoom-in-95 duration-200 text-[#3A2034]">
        
        {/* Header */}
        <div className="p-4 flex items-center gap-3 border-b border-[#EEE7F7]/60 bg-white/90 backdrop-blur-xl">
          <button onClick={onClose} className="p-2.5 -ml-2 rounded-full hover:bg-slate-100 text-gray-400 hover:text-[#3A2034] transition-colors focus:outline-none focus:ring-2 focus:ring-[#D97A89]/20">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <div className="flex-1 relative">
            <input 
              type="text" 
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by username..." 
              className="w-full bg-slate-100/60 text-[#3A2034] font-medium rounded-2xl py-2.5 px-4 focus:outline-none focus:ring-4 focus:ring-[#D97A89]/10 focus:bg-white border border-transparent focus:border-[#D97A89]/30 transition-all placeholder-gray-400"
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-2 bg-white">
          {isSearching && (
            <div className="p-4 text-center text-sm text-gray-400 font-medium animate-pulse">Searching...</div>
          )}
          
          {!isSearching && query.length >= 2 && results.length === 0 && (
            <div className="p-8 text-center flex flex-col items-center justify-center h-full opacity-60">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-[#D97A89]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
              </div>
              <p className="text-[#3A2034] font-semibold">No users found</p>
            </div>
          )}

          {!isSearching && results.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-2xl cursor-pointer transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-tr from-[#3A2034] to-[#5a3652] text-white rounded-[20px] flex items-center justify-center font-bold text-lg shadow-sm">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-[15px] text-[#3A2034]">{user.username}</p>
                  <p className="text-[13px] text-gray-500 line-clamp-1 font-medium">{user.bio || 'No bio available'}</p>
                </div>
              </div>
              
              {requestSentTo === user.id ? (
                <button disabled className="px-4 py-2 bg-white text-[#D97A89] rounded-xl text-[13px] font-bold border border-[#D97A89]/20 flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-[#D97A89] border-t-transparent rounded-full animate-spin"></div>
                  Opening...
                </button>
              ) : (
                <button onClick={() => handleSendRequest(user.id)} className="px-5 py-2 bg-[#D97A89] text-white rounded-xl text-[13px] font-bold hover:bg-[#b35e6b] shadow-md hover:shadow-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 active:scale-95 flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                  Message
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

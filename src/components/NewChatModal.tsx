"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { searchUsers, createDirectConversation } from "@/app/actions/chat";

export default function NewChatModal({ onClose, onChatCreated }: { onClose: () => void, onChatCreated: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [requestSentTo, setRequestSentTo] = useState<string | null>(null);
  const tappedRef = useRef(false);

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

  const handleSendRequest = async (user: any) => {
    // Prevent double-fire from pointerdown + click
    if (tappedRef.current) return;
    tappedRef.current = true;
    setTimeout(() => { tappedRef.current = false; }, 1000);

    setRequestSentTo(user.id);
    onChatCreated();

    // Run server action in background, navigate instantly once we have the ID
    const res = await createDirectConversation(user.id);
    if (res.success && res.conversationId) {
      router.push(`/room/${res.conversationId}`);
    } else {
      setRequestSentTo(null);
      tappedRef.current = false;
      alert(res.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#326080]/35 backdrop-blur-sm z-50 flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#FFF8F2] w-full sm:max-w-md rounded-none sm:rounded-[32px] shadow-none sm:shadow-[0_8px_40px_rgb(50,96,128,0.12)] sm:border border-[#326080]/8 overflow-hidden flex flex-col h-full sm:h-[500px] animate-in zoom-in-95 duration-200 text-[#326080]">
        
        {/* Header */}
        <div className="p-4 flex items-center gap-3 border-b border-[#326080]/8 bg-[#FFF8F2]/90 backdrop-blur-xl">
          <button onClick={onClose} className="p-2.5 -ml-2 rounded-full hover:bg-[#B5D2E6]/20 text-[#5A7A90] hover:text-[#326080] transition-colors focus:outline-none focus:ring-2 focus:ring-[#B5D2E6]/30">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <div className="flex-1 relative">
            <input 
              type="text" 
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by username..." 
              className="w-full bg-[#FFF1E7] text-[#326080] font-medium rounded-2xl py-2.5 px-4 focus:outline-none focus:ring-4 focus:ring-[#B5D2E6]/20 focus:bg-white border border-transparent focus:border-[#B5D2E6]/50 transition-all placeholder-[#8BAAB8]"
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-2 bg-[#FFF8F2]">
          {isSearching && (
            <div className="p-4 text-center text-sm text-gray-400 font-medium animate-pulse">Searching...</div>
          )}
          
          {!isSearching && query.length >= 2 && results.length === 0 && (
            <div className="p-8 text-center flex flex-col items-center justify-center h-full opacity-60">
              <div className="w-16 h-16 bg-[#B5D2E6]/30 rounded-full flex items-center justify-center mb-4 text-[#326080]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
              </div>
              <p className="text-[#326080] font-semibold">No users found</p>
            </div>
          )}

          {!isSearching && results.map((user) => (
            <div
              key={user.id}
              onPointerDown={(e) => {
                e.preventDefault();
                handleSendRequest(user);
              }}
              style={{ touchAction: 'manipulation', cursor: 'pointer', userSelect: 'none' }}
              className="flex items-center justify-between p-3 hover:bg-[#B5D2E6]/10 active:bg-[#B5D2E6]/20 rounded-2xl transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-tr from-[#326080] to-[#4A7A98] text-white rounded-[20px] flex items-center justify-center font-bold text-lg shadow-sm">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-[15px] text-[#326080]">{user.username}</p>
                  <p className="text-[13px] text-[#5A7A90] line-clamp-1 font-medium">{user.bio || 'No bio available'}</p>
                </div>
              </div>

              {requestSentTo === user.id ? (
                <div className="px-4 py-2 bg-white text-[#805232] rounded-xl text-[13px] font-bold border border-[#805232]/20 flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-[#805232] border-t-transparent rounded-full animate-spin"></div>
                  Opening...
                </div>
              ) : (
                <div className="px-5 py-2 bg-[#805232] text-white rounded-xl text-[13px] font-bold shadow-md flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                  Message
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

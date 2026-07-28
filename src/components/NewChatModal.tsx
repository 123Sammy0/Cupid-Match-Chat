"use client";

import { useState, useEffect } from "react";
import { searchUsers, sendChatRequest } from "@/app/actions/chat";

export default function NewChatModal({ onClose, onChatCreated }: { onClose: () => void, onChatCreated: () => void }) {
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
    const res = await sendChatRequest(userId);
    if (res.success) {
      setRequestSentTo(userId);
    } else {
      alert(res.message); // In a real app, use toast
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[500px] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 flex items-center gap-3 border-b border-gray-100">
          <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <div className="flex-1 relative">
            <input 
              type="text" 
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by username..." 
              className="w-full bg-gray-100 text-black rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-black/10 transition-shadow"
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-2">
          {isSearching && (
            <div className="p-4 text-center text-sm text-gray-400 animate-pulse">Searching...</div>
          )}
          
          {!isSearching && query.length >= 2 && results.length === 0 && (
            <div className="p-8 text-center flex flex-col items-center justify-center h-full opacity-50">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="mb-3 text-gray-400">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <p className="text-gray-500 font-medium text-sm">No users found</p>
            </div>
          )}

          {!isSearching && results.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-2xl cursor-pointer transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center font-bold text-lg">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-black">{user.username}</p>
                  <p className="text-xs text-gray-500 line-clamp-1">{user.bio || 'No bio'}</p>
                </div>
              </div>
              
              {requestSentTo === user.id ? (
                <button disabled className="px-4 py-1.5 bg-gray-100 text-gray-400 rounded-full text-xs font-bold">Sent</button>
              ) : (
                <button onClick={() => handleSendRequest(user.id)} className="px-4 py-1.5 bg-black text-white rounded-full text-xs font-bold hover:bg-gray-800 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                  Request
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

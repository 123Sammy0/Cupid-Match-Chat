"use client";

import { useState } from "react";
import Link from "next/link";

export default function ChatMonitorPage() {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Mock Data
  const mockChats = [
    { id: "msg_123", roomCode: "ROOM-789", sender: "alex_dev", receiver: "sarah_m", text: "Hey, did you finish the project?", timestamp: "10 mins ago", hasMedia: false, status: "active" },
    { id: "msg_124", roomCode: "ROOM-789", sender: "sarah_m", receiver: "alex_dev", text: "Almost done, just fixing bugs.", timestamp: "8 mins ago", hasMedia: false, status: "active" },
    { id: "msg_125", roomCode: "ROOM-404", sender: "john_doe", receiver: "mike_r", text: "[Image Uploaded]", timestamp: "1 hour ago", hasMedia: true, status: "deleted" },
    { id: "msg_126", roomCode: "ROOM-101", sender: "mike_r", receiver: "alex_dev", text: "Check this out!", timestamp: "2 hours ago", hasMedia: false, status: "active" },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Global Chat Monitor</h1>
          <p className="text-zinc-400 mt-1">Search and moderate cross-platform conversations securely.</p>
        </div>
        <button className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 text-sm font-bold rounded-lg hover:bg-red-500 hover:text-white transition-colors">
          Purge Selected
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <input 
            type="text" 
            placeholder="Search by keyword, user ID, or Room Code..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
        </div>
        <select className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none">
          <option value="all">All Content</option>
          <option value="text">Text Only</option>
          <option value="media">Contains Media</option>
        </select>
        <select className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none">
          <option value="active">Active Messages</option>
          <option value="deleted">Soft Deleted</option>
        </select>
      </div>

      {/* Chat Logs Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-950/50 text-zinc-400 border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-medium w-12"><input type="checkbox" className="rounded bg-zinc-950 border-zinc-700" /></th>
                <th className="px-6 py-4 font-medium">Room Code</th>
                <th className="px-6 py-4 font-medium">Participants</th>
                <th className="px-6 py-4 font-medium min-w-[300px]">Message Content</th>
                <th className="px-6 py-4 font-medium">Time</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {mockChats.map((chat) => (
                <tr key={chat.id} className={`hover:bg-zinc-800/30 transition-colors ${chat.status === 'deleted' ? 'opacity-50' : ''}`}>
                  <td className="px-6 py-4"><input type="checkbox" className="rounded bg-zinc-950 border-zinc-700" /></td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs bg-zinc-950 border border-zinc-800 px-2 py-1 rounded text-zinc-300">
                      {chat.roomCode}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-blue-400">{chat.sender}</span>
                      <span className="text-xs text-zinc-500">to <span className="text-zinc-300">{chat.receiver}</span></span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {chat.hasMedia && <span className="text-blue-500"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></span>}
                      <span className={chat.status === 'deleted' ? 'line-through text-zinc-500' : 'text-zinc-200'}>
                        {chat.text}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-zinc-500 text-xs">{chat.timestamp}</td>
                  <td className="px-6 py-4 text-right">
                    {chat.status === 'active' ? (
                      <button className="px-3 py-1.5 bg-zinc-800 hover:bg-red-500 hover:text-white rounded-lg text-xs font-medium transition-colors">
                        Delete
                      </button>
                    ) : (
                      <button className="px-3 py-1.5 bg-zinc-800 hover:bg-emerald-500 hover:text-white rounded-lg text-xs font-medium transition-colors">
                        Restore
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

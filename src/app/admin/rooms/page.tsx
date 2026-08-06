"use client";

import { useState } from "react";
import Link from "next/link";

export default function RoomManagementPage() {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Mock Data
  const mockRooms = [
    { id: "room_1", code: "LOVE-1234", participants: 2, messages: 154, created: "2 days ago", locked: false },
    { id: "room_2", code: "CHAT-9000", participants: 2, messages: 32, created: "5 days ago", locked: true },
    { id: "room_3", code: "SECRET-55", participants: 2, messages: 890, created: "1 week ago", locked: false },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Room Management</h1>
          <p className="text-zinc-400 mt-1">Manage private chat rooms and Gate Entry passwords.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold rounded-lg transition-colors shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            Change Gate Password
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <input 
            type="text" 
            placeholder="Search by Room Code..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
        </div>
        <select className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none">
          <option value="all">All Rooms</option>
          <option value="active">Active Rooms</option>
          <option value="locked">Locked Rooms</option>
        </select>
      </div>

      {/* Rooms Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-950/50 text-zinc-400 border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-medium">Room Code</th>
                <th className="px-6 py-4 font-medium text-center">Participants</th>
                <th className="px-6 py-4 font-medium text-center">Total Messages</th>
                <th className="px-6 py-4 font-medium">Created</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {mockRooms.map((room) => (
                <tr key={room.id} className={`hover:bg-zinc-800/30 transition-colors ${room.locked ? 'bg-red-500/5' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {room.locked && <svg className="text-red-500" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
                      <span className="font-mono font-bold text-white tracking-wide">{room.code}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-zinc-950 border border-zinc-800 font-semibold">
                      {room.participants}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-semibold text-zinc-300">{room.messages}</td>
                  <td className="px-6 py-4 text-zinc-500">{room.created}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/chats?room=${room.code}`} className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-medium transition-colors">
                        View Chat
                      </Link>
                      <button className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${room.locked ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white' : 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white'}`}>
                        {room.locked ? 'Unlock' : 'Lock'}
                      </button>
                    </div>
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

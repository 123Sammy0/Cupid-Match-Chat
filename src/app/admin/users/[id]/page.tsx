"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function UserDetailPage() {
  const params = useParams();
  const userId = params.id as string;
  
  // Mock Data
  const user = {
    id: userId,
    username: "alex_dev",
    email: "alex@example.com",
    role: "user",
    status: "active",
    joinDate: "2026-07-15",
    lastSeen: "2 hours ago",
    messages: 1450,
    storageUsed: "45 MB",
  };

  const [isImpersonating, setIsImpersonating] = useState(false);

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/users" className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            {user.username}
            <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 uppercase tracking-wide">
              {user.status}
            </span>
          </h1>
          <p className="text-sm text-zinc-400 mt-0.5">{user.email} &bull; ID: {user.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Stats & Info */}
        <div className="col-span-1 flex flex-col gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center text-3xl font-bold mb-4">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-lg font-bold">{user.username}</h2>
            <p className="text-sm text-zinc-400 mb-6">{user.role}</p>
            
            <div className="w-full grid grid-cols-2 gap-2 text-left">
              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                <p className="text-xs text-zinc-500 mb-1">Joined</p>
                <p className="text-sm font-semibold">{user.joinDate}</p>
              </div>
              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                <p className="text-xs text-zinc-500 mb-1">Last Seen</p>
                <p className="text-sm font-semibold">{user.lastSeen}</p>
              </div>
              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                <p className="text-xs text-zinc-500 mb-1">Messages</p>
                <p className="text-sm font-semibold">{user.messages}</p>
              </div>
              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                <p className="text-xs text-zinc-500 mb-1">Storage</p>
                <p className="text-sm font-semibold">{user.storageUsed}</p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Administrative Actions</h3>
            <div className="flex flex-col gap-2">
              <button className="w-full text-left px-4 py-3 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-sm font-medium transition-colors">
                Change Role
              </button>
              <button className="w-full text-left px-4 py-3 rounded-lg bg-zinc-950 hover:bg-yellow-500/10 hover:text-yellow-500 hover:border-yellow-500/20 border border-zinc-800 text-sm font-medium transition-colors">
                Suspend User
              </button>
              <button className="w-full text-left px-4 py-3 rounded-lg bg-zinc-950 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 border border-zinc-800 text-sm font-medium transition-colors">
                Ban User
              </button>
              <div className="my-2 border-t border-zinc-800"></div>
              <button className="w-full text-left px-4 py-3 rounded-lg bg-red-500 text-white text-sm font-bold transition-colors shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                Soft Delete Account
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Impersonation & Activity */}
        <div className="col-span-2 flex flex-col gap-6">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-blue-400">Secure Impersonation Context</h3>
              <p className="text-sm text-blue-400/80 mt-1 max-w-md">
                Launch a read-only instance of the frontend as this user. Your Super Admin session remains isolated. Actions taken in this context will be logged.
              </p>
            </div>
            <button 
              onClick={() => setIsImpersonating(true)}
              className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition-colors"
            >
              {isImpersonating ? "Connecting..." : "Impersonate"}
            </button>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex-1">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Recent Chat Activity</h3>
              <Link href={`/admin/chats?user=${user.id}`} className="text-sm text-blue-400 hover:underline">View All Chats</Link>
            </div>
            
            {/* Mock Chat List */}
            <div className="flex flex-col gap-3">
              {[1,2,3].map((i) => (
                <div key={i} className="p-4 rounded-xl border border-zinc-800 bg-zinc-950 flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-zinc-800"></div>
                    <div>
                      <h4 className="font-medium text-sm">Conversation with User_{i}</h4>
                      <p className="text-xs text-zinc-500 mt-0.5">Last message: "Hey, how are you?" • 2h ago</p>
                    </div>
                  </div>
                  <button className="px-3 py-1.5 text-xs font-medium bg-zinc-800 hover:bg-zinc-700 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                    Inspect
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

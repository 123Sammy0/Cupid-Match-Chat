"use client";

import { useState } from "react";

export default function TrashRecoveryPage() {
  const [activeTab, setActiveTab] = useState("users");

  const tabs = [
    { id: "users", label: "Users" },
    { id: "chats", label: "Chats & Messages" },
    { id: "rooms", label: "Rooms" },
    { id: "media", label: "Media" },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trash & Recovery</h1>
          <p className="text-zinc-400 mt-1">Review, restore, or permanently delete soft-deleted items. Items are purged after 30 days.</p>
        </div>
        <button className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-lg transition-colors shadow-[0_0_15px_rgba(239,68,68,0.3)]">
          Empty All Trash
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 gap-6 mt-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 text-sm font-medium transition-colors relative ${
              activeTab === tab.id ? "text-white" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white rounded-t-full"></div>
            )}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center min-h-[400px]">
        {/* Placeholder for Empty State */}
        <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4 text-zinc-500">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/></svg>
        </div>
        <h3 className="text-lg font-bold text-white mb-2 capitalize">No deleted {activeTab} found</h3>
        <p className="text-sm text-zinc-400 max-w-md">
          Any {activeTab} that are deleted by Admins will appear here. You can restore them or permanently wipe them from the database.
        </p>
      </div>
    </div>
  );
}

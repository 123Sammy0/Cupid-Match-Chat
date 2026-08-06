"use client";

import { useState } from "react";

export default function AuditLogsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const mockLogs = [
    { id: "log_1", admin: "mdsaakib002", action: "DELETE_USER", target: "john_doe (ID: 4)", date: "2026-08-06 15:30:12" },
    { id: "log_2", admin: "mdsaakib002", action: "TOGGLE_FEATURE", target: "maintenance_mode -> ON", date: "2026-08-06 14:12:05" },
    { id: "log_3", admin: "mdsaakib002", action: "LOGIN", target: "System", date: "2026-08-06 10:00:00" },
    { id: "log_4", admin: "system", action: "AUTO_PURGE", target: "Trash (24 items)", date: "2026-08-05 00:00:00" },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-zinc-400 mt-1">Immutable record of all administrative actions for security tracking.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors">
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <input 
            type="text" 
            placeholder="Search logs by action, admin, or target..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
        </div>
        <input 
          type="date" 
          className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
        />
      </div>

      {/* Logs Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-950/50 text-zinc-400 border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-medium">Timestamp</th>
                <th className="px-6 py-4 font-medium">Admin / Actor</th>
                <th className="px-6 py-4 font-medium">Action</th>
                <th className="px-6 py-4 font-medium">Target Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50 font-mono">
              {mockLogs.map((log) => (
                <tr key={log.id} className="hover:bg-zinc-800/30 transition-colors text-xs">
                  <td className="px-6 py-4 text-zinc-500">{log.date}</td>
                  <td className="px-6 py-4 text-blue-400">{log.admin}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-zinc-300">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-300">{log.target}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

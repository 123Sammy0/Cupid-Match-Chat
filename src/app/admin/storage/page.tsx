"use client";

import { useState } from "react";

export default function StorageManagementPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const mockFiles = [
    { id: "file_1", name: "1786001155496.jpg", type: "Image", size: "2.4 MB", owner: "alex_dev", date: "2026-08-06", url: "#" },
    { id: "file_2", name: "voice_note_1.mp3", type: "Audio", size: "1.1 MB", owner: "sarah_m", date: "2026-08-05", url: "#" },
    { id: "file_3", name: "video_clip_99.mp4", type: "Video", size: "14.5 MB", owner: "john_doe", date: "2026-08-04", url: "#" },
  ];

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Storage Management</h1>
          <p className="text-zinc-400 mt-1">Monitor and clean up media assets across the platform.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors">
            Export JSON
          </button>
          <button className="px-4 py-2 bg-white text-black text-sm font-bold rounded-lg hover:bg-zinc-200 transition-colors shadow-lg shadow-white/10">
            Clean Orphaned Files
          </button>
        </div>
      </div>

      {/* Storage Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StorageCard title="Images" size="4.5 GB" count="12,450 files" color="bg-blue-500" />
        <StorageCard title="Videos" size="8.2 GB" count="840 files" color="bg-purple-500" />
        <StorageCard title="Voice Notes" size="1.1 GB" count="5,200 files" color="bg-emerald-500" />
        <StorageCard title="Documents" size="0.2 GB" count="120 files" color="bg-orange-500" />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col">
        <div className="p-4 border-b border-zinc-800 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full max-w-md">
            <input 
              type="text" 
              placeholder="Search files by name or owner..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
          </div>
          <select className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-sm focus:outline-none w-full sm:w-auto">
            <option value="all">All Media Types</option>
            <option value="image">Images Only</option>
            <option value="video">Videos Only</option>
            <option value="audio">Audio Only</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-950/50 text-zinc-400 border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-medium w-12"><input type="checkbox" className="rounded bg-zinc-950 border-zinc-700" /></th>
                <th className="px-6 py-4 font-medium">Preview / Name</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Size</th>
                <th className="px-6 py-4 font-medium">Owner</th>
                <th className="px-6 py-4 font-medium">Uploaded</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {mockFiles.map((file) => (
                <tr key={file.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4"><input type="checkbox" className="rounded bg-zinc-950 border-zinc-700" /></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center overflow-hidden">
                        {file.type === "Image" ? (
                          <div className="w-full h-full bg-zinc-700"></div> // Mock image thumbnail
                        ) : (
                          <svg className="text-zinc-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        )}
                      </div>
                      <span className="font-medium text-white truncate max-w-[200px]">{file.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs bg-zinc-950 border border-zinc-800 px-2 py-1 rounded text-zinc-300">{file.type}</span>
                  </td>
                  <td className="px-6 py-4 text-zinc-300 font-medium">{file.size}</td>
                  <td className="px-6 py-4 text-blue-400 hover:underline cursor-pointer">{file.owner}</td>
                  <td className="px-6 py-4 text-zinc-500">{file.date}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-medium transition-colors">Download</button>
                      <button className="px-3 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg text-xs font-medium transition-colors">Delete</button>
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

function StorageCard({ title, size, count, color }: any) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-3 h-3 rounded-full ${color}`}></div>
        <h3 className="font-semibold text-zinc-400">{title}</h3>
      </div>
      <div className="text-3xl font-bold tracking-tight text-white">{size}</div>
      <p className="text-sm text-zinc-500 mt-1">{count}</p>
    </div>
  );
}

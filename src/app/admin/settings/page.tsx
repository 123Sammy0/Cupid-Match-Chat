"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [flags, setFlags] = useState({
    maintenance_mode: false,
    registration_enabled: true,
    guest_access: false,
  });

  const [limits, setLimits] = useState({
    image_mb: 10,
    video_mb: 50,
    audio_mb: 20,
    doc_mb: 20,
  });

  const toggleFlag = (key: keyof typeof flags) => {
    setFlags(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Global Settings & Flags</h1>
        <p className="text-zinc-400 mt-1">Manage application features and upload limits dynamically.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Feature Flags */}
        <div className="flex flex-col gap-6">
          <h2 className="text-xl font-bold">Feature Flags</h2>
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-6">
            <ToggleRow 
              title="Maintenance Mode" 
              description="Locks down the entire application for regular users. Super Admins bypass this."
              enabled={flags.maintenance_mode}
              onToggle={() => toggleFlag("maintenance_mode")}
              danger
            />
            <div className="border-t border-zinc-800"></div>
            <ToggleRow 
              title="User Registration" 
              description="Allow new users to sign up for accounts."
              enabled={flags.registration_enabled}
              onToggle={() => toggleFlag("registration_enabled")}
            />
            <div className="border-t border-zinc-800"></div>
            <ToggleRow 
              title="Guest Access" 
              description="Allow unauthenticated users to view public rooms."
              enabled={flags.guest_access}
              onToggle={() => toggleFlag("guest_access")}
            />
          </div>
        </div>

        {/* Upload Limits */}
        <div className="flex flex-col gap-6">
          <h2 className="text-xl font-bold">Upload Limits (MB)</h2>
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-4">
            <LimitRow title="Images" value={limits.image_mb} onChange={(v: number) => setLimits({...limits, image_mb: v})} />
            <LimitRow title="Videos" value={limits.video_mb} onChange={(v: number) => setLimits({...limits, video_mb: v})} />
            <LimitRow title="Audio" value={limits.audio_mb} onChange={(v: number) => setLimits({...limits, audio_mb: v})} />
            <LimitRow title="Documents" value={limits.doc_mb} onChange={(v: number) => setLimits({...limits, doc_mb: v})} />
            
            <button className="mt-4 w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors">
              Save Limits
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-red-500 mb-6 flex items-center gap-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          Danger Zone
        </h2>
        
        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-white">Purge All Soft-Deleted Data</h3>
              <p className="text-sm text-zinc-400 mt-1">Permanently deletes all users, chats, and media in the Trash. This action is irreversible.</p>
            </div>
            <button className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-colors flex-shrink-0">
              Empty Trash Now
            </button>
          </div>
          
          <div className="border-t border-red-500/20"></div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-white">Reset Database Cache</h3>
              <p className="text-sm text-zinc-400 mt-1">Clears all Redis/Memory cache across the server cluster.</p>
            </div>
            <button className="px-6 py-2.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-white font-bold rounded-lg transition-colors flex-shrink-0">
              Flush Cache
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ title, description, enabled, onToggle, danger }: any) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex flex-col">
        <h3 className="font-semibold text-white">{title}</h3>
        <p className="text-sm text-zinc-400 mt-0.5">{description}</p>
      </div>
      <button 
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${enabled ? (danger ? 'bg-red-500' : 'bg-emerald-500') : 'bg-zinc-700'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}

function LimitRow({ title, value, onChange }: any) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="font-medium text-zinc-300">{title}</span>
      <div className="flex items-center gap-2">
        <input 
          type="number" 
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-20 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-right focus:outline-none focus:border-white transition-all"
        />
        <span className="text-sm text-zinc-500">MB</span>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { getGlobalSettings, updateGlobalSetting } from "@/app/actions/admin";

export default function RoomManagementPage() {
  const [gatePassword, setGatePassword] = useState("");
  const [gateEnabled, setGateEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const loadGateConfig = async () => {
    setIsLoading(true);
    setError("");
    try {
      const settings = await getGlobalSettings();
      const gateSetting = settings.find((s: any) => s.key === 'gate_password');
      if (gateSetting) {
        setGatePassword(gateSetting.value?.password || '');
        setGateEnabled(gateSetting.enabled);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGateConfig();
  }, []);

  const handleSaveGatePassword = async () => {
    if (!gatePassword.trim()) {
      alert("Gate password cannot be empty.");
      return;
    }
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await updateGlobalSetting('gate_password', gateEnabled, { password: gatePassword });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e: any) {
      alert(`Failed to update gate password: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gate & Access Control</h1>
        <p className="text-zinc-400 mt-1">Manage the gate access code that users must enter before reaching the login screen.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* Gate Password Management */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold">Gate Access Code</h2>
            <p className="text-sm text-zinc-400">Users must enter this code on the gate page to access the app.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="animate-pulse text-zinc-500">Loading gate configuration...</div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1 w-full">
                <label className="text-sm text-zinc-400 mb-1 block">Current Gate Password</label>
                <input
                  type="text"
                  value={gatePassword}
                  onChange={(e) => setGatePassword(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg px-4 py-3 text-lg font-mono tracking-widest focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  placeholder="Enter gate password"
                />
              </div>
              <div className="flex-shrink-0 self-end">
                <button
                  onClick={handleSaveGatePassword}
                  disabled={isSaving}
                  className={`px-6 py-3 text-sm font-bold rounded-lg transition-all shadow-lg disabled:opacity-50 ${
                    saveSuccess
                      ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                      : 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/20'
                  }`}
                >
                  {isSaving ? "Saving..." : saveSuccess ? "✓ Saved!" : "Update Password"}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-lg border border-zinc-800">
              <div>
                <span className="text-sm font-medium text-white">Gate Enabled</span>
                <p className="text-xs text-zinc-500 mt-0.5">When disabled, users bypass the gate screen entirely.</p>
              </div>
              <button
                onClick={async () => {
                  const newState = !gateEnabled;
                  setGateEnabled(newState);
                  try {
                    await updateGlobalSetting('gate_password', newState, { password: gatePassword });
                  } catch (e: any) {
                    setGateEnabled(!newState);
                    alert(`Failed: ${e.message}`);
                  }
                }}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                  gateEnabled ? 'bg-emerald-500' : 'bg-zinc-700'
                }`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                  gateEnabled ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 text-xs text-zinc-500">
              <strong className="text-zinc-400">Data source:</strong> <code className="text-emerald-400">public.feature_flags</code> where key = &apos;gate_password&apos;.
              The gate page reads this value in real-time via a server action.
            </div>
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-3">About Rooms</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          This application uses a conversation-based architecture (not room codes). Private conversations are created
          when users search for and connect with each other. Room management is handled through the
          <a href="/admin/chats" className="text-blue-400 hover:text-blue-300 ml-1">Chat Monitor</a> section.
        </p>
      </div>
    </div>
  );
}

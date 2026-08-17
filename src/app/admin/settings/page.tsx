"use client";

import { useEffect, useState } from "react";
import { getGlobalSettings, updateGlobalSetting } from "@/app/actions/admin";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingKey, setProcessingKey] = useState<string | null>(null);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const data = await getGlobalSettings();
      setSettings(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleToggle = async (key: string, currentEnabled: boolean, value: any) => {
    setProcessingKey(key);
    try {
      await updateGlobalSetting(key, !currentEnabled, value);
      await loadSettings();
    } catch (e: any) {
      alert(`Error updating setting: ${e.message}`);
    } finally {
      setProcessingKey(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Global Settings</h1>
        <p className="text-zinc-400 mt-1">Platform-wide configurations and feature flags.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        {isLoading ? (
          <div className="text-zinc-500 animate-pulse">Loading settings...</div>
        ) : settings.length === 0 ? (
          <div className="text-zinc-500">No feature flags found in database.</div>
        ) : (
          <div className="flex flex-col gap-6">
            {settings.map(setting => (
              <div key={setting.key} className="flex items-center justify-between border-b border-zinc-800 pb-6 last:border-0 last:pb-0">
                <div className="flex flex-col max-w-[70%]">
                  <h3 className="text-lg font-semibold capitalize text-white">{setting.key.replace(/_/g, ' ')}</h3>
                  <p className="text-sm text-zinc-400 mt-1 leading-relaxed">{setting.description}</p>
                </div>
                
                <button
                  disabled={processingKey === setting.key}
                  onClick={() => handleToggle(setting.key, setting.enabled, setting.value)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-zinc-900 ${
                    setting.enabled ? 'bg-emerald-500' : 'bg-zinc-700'
                  } ${processingKey === setting.key ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      setting.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

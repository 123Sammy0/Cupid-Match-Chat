"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getProfile, updateProfile } from "@/app/actions/settings";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [bio, setBio] = useState("");
  const [privacy, setPrivacy] = useState({ online_status: "everyone", last_seen: "everyone" });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      const data = await getProfile();
      if (data) {
        setProfile(data);
        setBio(data.bio || "");
        if (data.privacy_settings) {
          setPrivacy(data.privacy_settings);
        }
      }
    };
    loadProfile();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage("");
    const res = await updateProfile(bio, privacy);
    setIsSaving(false);
    if (res.success) {
      setMessage("Settings saved successfully.");
    } else {
      setMessage("Failed to save settings.");
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth");
  };

  if (!profile) {
    return <div className="flex h-screen items-center justify-center bg-[#FAF6EE] text-black">Loading...</div>;
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#FAF6EE] text-black">
      <section className="bg-white shadow-xl relative w-full max-w-[450px] h-full sm:h-[90vh] sm:rounded-[32px] overflow-hidden flex flex-col border border-gray-100">
        
        {/* Top Bar */}
        <header className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-md text-black z-10 border-b border-gray-100 sticky top-0">
          <button onClick={() => router.push('/room')} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors" aria-label="Back">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>
          <h1 className="font-bold text-lg">Settings</h1>
          <div className="w-10"></div> {/* Spacer for centering */}
        </header>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
          
          {/* Profile Section */}
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="relative">
              <div className="w-24 h-24 bg-black text-white rounded-full flex items-center justify-center font-bold text-4xl shadow-md">
                {profile.username.charAt(0).toUpperCase()}
              </div>
              <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow border border-gray-100 hover:bg-gray-50 text-black">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              </button>
            </div>
            <div>
              <h2 className="text-xl font-bold">{profile.username}</h2>
              <p className="text-sm text-gray-500">@{profile.username}</p>
            </div>
          </div>

          {/* Form */}
          <div className="flex flex-col gap-6">
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-800">Bio</label>
              <textarea 
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A little bit about yourself..."
                className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black/10 resize-none h-24 text-sm"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-800">Privacy - Online Status</label>
              <select 
                value={privacy.online_status}
                onChange={(e) => setPrivacy({...privacy, online_status: e.target.value})}
                className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black/10 text-sm appearance-none"
              >
                <option value="everyone">Everyone</option>
                <option value="contacts">Contacts Only</option>
                <option value="nobody">Nobody</option>
              </select>
            </div>

            {message && (
              <p className={`text-sm text-center font-medium ${message.includes('success') ? 'text-green-600' : 'text-red-500'}`}>
                {message}
              </p>
            )}

            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-3.5 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-transform active:scale-[0.98]"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>

          {/* Danger Zone */}
          <div className="mt-8 pt-8 border-t border-gray-100 flex flex-col gap-4">
            <button 
              onClick={handleLogout}
              className="w-full py-3.5 bg-gray-100 text-black rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
              Log out
            </button>
            <button className="w-full py-3.5 text-red-500 font-bold hover:bg-red-50 rounded-xl transition-colors">
              Delete Account
            </button>
          </div>

        </div>
      </section>
    </div>
  );
}

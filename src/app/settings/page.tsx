"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getProfile, updateProfile } from "@/app/actions/settings";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem("cupid_cache_profile");
        return cached ? JSON.parse(cached) : null;
      } catch (e) { return null; }
    }
    return null;
  });
  const [bio, setBio] = useState(profile?.bio || "");
  const [privacy, setPrivacy] = useState(profile?.privacy_settings || { online_status: "everyone", last_seen: "everyone" });
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const AVATARS = ["😀", "😎", "🤩", "🦊", "🐼", "🦄", "🐶", "🐱", "🦁", "🐙", "🦋", "🍄", "🍉", "🍕", "🚀", "🎸"];

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    try {
      const cached = sessionStorage.getItem("cupid_cache_profile");
      if (cached) {
        const data = JSON.parse(cached);
        setProfile(data);
        setBio(data.bio || "");
        setAvatarUrl(data.avatar_url || "");
        if (data.privacy_settings) {
          setPrivacy(data.privacy_settings);
        }
      }
    } catch (e) {}

    const loadProfile = async () => {
      const data: any = await getProfile();
      if (data) {
        setProfile((prev: any) => {
          // If the user hasn't modified the bio/avatar from the cached version, update them
          if (!prev || prev.bio === bio) setBio(data.bio || "");
          if (!prev || prev.avatar_url === avatarUrl) setAvatarUrl(data.avatar_url || "");
          // Privacy is complex to compare, just update if it's initial load or unchanged
          if (!prev || JSON.stringify(prev.privacy_settings) === JSON.stringify(privacy)) {
            if (data.privacy_settings) setPrivacy(data.privacy_settings);
          }
          return data;
        });
        try {
          sessionStorage.setItem("cupid_cache_profile", JSON.stringify(data));
        } catch (e) {}
      }
    };
    loadProfile();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("Image must be less than 10MB");
      return;
    }
    setIsUploadingImage(true);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop();
      const path = `avatars/${profile.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(path, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('chat-media').getPublicUrl(path);
      setAvatarUrl(urlData.publicUrl);
    } catch (error: any) {
      alert("Failed to upload image: " + error.message);
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage("");
    const res = await updateProfile(bio, privacy, avatarUrl);
    setIsSaving(false);
    if (res.success) {
      if (profile) {
        try {
          sessionStorage.setItem("cupid_cache_profile", JSON.stringify({
            ...profile,
            bio,
            privacy_settings: privacy,
            avatar_url: avatarUrl
          }));
        } catch (e) {}
      }
      setMessage("Settings saved successfully! Returning to chats...");
      setTimeout(() => router.push('/room'), 1500);
    } else {
      setMessage(res.message || "Failed to save settings.");
    }
  };

  const handleLogout = async () => {
    try {
      sessionStorage.clear();
      localStorage.clear();
    } catch (e) {}
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth");
  };

  if (!isClient || !profile) {
    return <div className="flex h-[100dvh] items-center justify-center bg-base text-text-main">Loading...</div>;
  }

  return (
    <div className="flex h-[100dvh] w-full items-center justify-center bg-base text-text-main sm:p-4">
      <section className="bg-surface shadow-[0_8px_40px_rgb(74,63,68,0.06)] relative w-full max-w-[450px] h-full sm:h-[90vh] sm:rounded-[40px] overflow-hidden flex flex-col border border-border-soft">
        
        {/* Top Bar */}
        <header className="flex items-center justify-between p-4 bg-surface/80 backdrop-blur-md text-text-main z-10 border-b border-border-soft sticky top-0">
          <button onClick={() => router.push('/room')} className="p-2 -ml-2 rounded-full hover:bg-border-soft transition-all active:scale-90 active:bg-base select-none cursor-pointer" aria-label="Back">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>
          <h1 className="font-bold text-lg">Settings</h1>
          <div className="w-10"></div> {/* Spacer for centering */}
        </header>

        <div className="flex-1 overflow-y-auto p-6 pb-24 flex flex-col gap-8 scrollbar-hide">
          
          {/* Profile Section */}
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/*" 
                className="hidden" 
              />
              <div className="w-24 h-24 bg-gradient-to-br from-accent to-accent-alt text-text-main rounded-[30px] flex items-center justify-center font-bold text-5xl shadow-md overflow-hidden relative border border-border-soft">
                {isUploadingImage ? (
                  <div className="w-6 h-6 border-4 border-text-main border-t-transparent rounded-full animate-spin"></div>
                ) : avatarUrl && avatarUrl.startsWith('http') ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  avatarUrl ? avatarUrl : profile.username.charAt(0).toUpperCase()
                )}
                
                {/* Upload Overlay */}
                <div className="absolute inset-0 bg-text-main/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-surface)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-main">{profile.username}</h2>
              <p className="text-sm text-text-sub">@{profile.username}</p>
            </div>
          </div>

          {/* Avatar Selector */}
          <div className="flex flex-col gap-3">
            <label className="text-sm font-bold text-gray-800 px-1">Choose Avatar</label>
            <div className="flex items-center gap-3 overflow-x-auto pb-4 px-1 snap-x scrollbar-hide">
              {AVATARS.map((av) => (
                <button
                  key={av}
                  onClick={() => setAvatarUrl(av)}
                  className={`flex-shrink-0 w-14 h-14 rounded-2xl text-2xl flex items-center justify-center transition-all snap-center shadow-sm active:scale-95 select-none cursor-pointer
                    ${avatarUrl === av ? 'bg-accent border-2 border-text-main scale-110' : 'bg-base hover:bg-border-soft border-2 border-transparent'}`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="flex flex-col gap-6">
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-text-main">Bio</label>
              <textarea 
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A little bit about yourself..."
                className="w-full p-4 bg-base rounded-2xl border border-border-soft focus:ring-2 focus:ring-accent-alt/50 resize-none h-24 text-sm text-text-main placeholder-text-sub/50"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-text-main">Privacy - Online Status</label>
              <select 
                value={privacy.online_status}
                onChange={(e) => setPrivacy({...privacy, online_status: e.target.value})}
                className="w-full p-4 bg-base rounded-2xl border border-border-soft focus:ring-2 focus:ring-accent-alt/50 text-sm appearance-none text-text-main"
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
              className="w-full py-3.5 bg-accent text-text-main rounded-xl font-bold hover:bg-accent/80 transition-transform active:scale-[0.98] select-none cursor-pointer shadow-sm border border-border-soft"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>

          {/* Danger Zone */}
          <div className="mt-8 pt-8 border-t border-border-soft flex flex-col gap-4">
            <button 
              onClick={handleLogout}
              className="w-full py-3.5 bg-base text-text-main rounded-xl font-bold hover:bg-border-soft transition-all active:scale-[0.98] select-none cursor-pointer flex items-center justify-center gap-2 border border-border-soft"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
              Log out
            </button>
            <button className="w-full py-3.5 text-text-main bg-accent-light/50 font-bold hover:bg-accent-light rounded-xl transition-colors border border-accent-light">
              Delete Account
            </button>
          </div>

        </div>
      </section>
    </div>
  );
}

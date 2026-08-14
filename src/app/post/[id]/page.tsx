"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { PinItem } from "@/app/components/PinDetailModal";
import { fetchPexelsImages } from "@/app/actions/pexels";
import { fetchPixabayImages } from "@/app/actions/pixabay";
import { LazyImage } from "@/app/components/LazyImage";
import { getProfile } from "@/app/actions/settings";

export default function PostDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [pin, setPin] = useState<PinItem | null>(null);
  const [relatedPins, setRelatedPins] = useState<PinItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<Array<{ id: string; text: string; date: string }>>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    // Load profile
    try {
      const cached = sessionStorage.getItem("cupid_cache_profile");
      if (cached) setProfile(JSON.parse(cached));
    } catch {}
    getProfile().then(data => {
      if (data) {
        setProfile(data);
        sessionStorage.setItem("cupid_cache_profile", JSON.stringify(data));
      }
    }).catch(() => {});
  }, []);

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    const loadPinData = async () => {
      try {
        const storedPin = sessionStorage.getItem("current_view_pin");
        if (storedPin) {
          const parsedPin = JSON.parse(storedPin) as PinItem;
          // Verify it matches the ID
          if (parsedPin.id.toString() === params.id) {
            setPin(parsedPin);
            fetchRelated(parsedPin);
            checkSaved(parsedPin.id.toString());
            loadComments(parsedPin.id.toString());
            setIsLoading(false);
            return;
          }
        }
      } catch {}

      // Fallback: If no pin data in sessionStorage, we fetch a random related list and pick first
      try {
        const fallbackQuery = "aesthetic " + (Math.random() > 0.5 ? "book" : "art");
        const px = await fetchPexelsImages(fallbackQuery, 1, 1);
        if (px.photos && px.photos.length > 0) {
          const fallbackPin = px.photos[0];
          fallbackPin.id = params.id; // spoof ID to avoid errors
          fallbackPin.tags = ["aesthetic"];
          setPin(fallbackPin);
          fetchRelated(fallbackPin);
          checkSaved(params.id);
          loadComments(params.id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPinData();
  }, [params.id]);

  const checkSaved = (id: string) => {
    try {
      const stored = localStorage.getItem("saved_pins");
      if (stored) {
        const parsed = JSON.parse(stored);
        setIsSaved(parsed.includes(id) || parsed.includes(Number(id)));
      }
    } catch {}
  };

  const loadComments = (id: string) => {
    try {
      const stored = localStorage.getItem(`pin_comments_${id}`);
      if (stored) setComments(JSON.parse(stored));
    } catch {}
  };

  const fetchRelated = async (p: PinItem) => {
    try {
      const query = (p.tags && p.tags.length > 0) ? p.tags.slice(0, 2).join(" ") : "aesthetic";
      const [px, pb] = await Promise.all([
        fetchPexelsImages(query, 1, 15),
        fetchPixabayImages(query, 1, 15)
      ]);
      const combined = [...(px.photos || []), ...(pb.photos || [])].sort(() => 0.5 - Math.random());
      setRelatedPins(combined);
    } catch {}
  };

  const handleToggleSave = () => {
    if (!pin) return;
    try {
      const stored = localStorage.getItem("saved_pins");
      let saves: Array<string | number> = stored ? JSON.parse(stored) : [];
      if (isSaved) {
        saves = saves.filter(id => id.toString() !== pin.id.toString());
        showToast("Removed from saved collection");
        setIsSaved(false);
      } else {
        saves.push(pin.id);
        showToast("Saved to your collection board ✦");
        setIsSaved(true);
      }
      localStorage.setItem("saved_pins", JSON.stringify(saves));
    } catch {}
  };

  const handlePostComment = () => {
    if (!commentText.trim() || !pin) return;
    const newComment = {
      id: Date.now().toString(),
      text: commentText.trim(),
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    };
    const updated = [...comments, newComment];
    setComments(updated);
    setCommentText("");
    try {
      localStorage.setItem(`pin_comments_${pin.id}`, JSON.stringify(updated));
    } catch {}
    showToast("Comment added");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}>
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
        </svg>
        <style dangerouslySetInnerHTML={{__html: `@keyframes spin { 100% { transform: rotate(360deg); } }`}} />
      </div>
    );
  }

  if (!pin) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center text-[var(--ink)] gap-4">
        <h2>Visual not found</h2>
        <button className="btn btn-primary" onClick={() => router.push('/')}>Return Home</button>
      </div>
    );
  }

  const imgSrc = pin.src?.large2x || pin.src?.large || pin.src?.medium || (pin as any).src;
  const pinTitle = pin.title || pin.alt || "Aesthetic Moment";
  const photographer = pin.photographer || "Curated Artist";
  const domainName = pin.provider === "pixabay" ? "pixabay.com" : pin.provider === "pexels" ? "pexels.com" : "library.art";
  const pinDesc = pin.description || (pin.alt ? `${pin.alt}. Captured by ${photographer}.` : `Curated visual captured with gentle lighting and rich aesthetic warmth by ${photographer}.`);
  const avatar = pin.photographer_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(photographer)}&backgroundColor=e8d98a,c48a6e,4f8b6e`;

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] pb-24">
      {/* Detail Page Topbar */}
      <header className="sticky top-0 z-50 h-[52px] bg-[var(--bg-alt)] border-b border-[var(--border)] px-4 sm:px-6 flex items-center justify-between shadow-sm">
        <button 
          onClick={() => router.push('/')}
          className="icon-btn hover:bg-black/5"
          aria-label="Back to feed"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <a className="brand" href="/" aria-label="Little Library home" style={{ fontSize: '18px' }}>
          little library<span className="brand-dot">.</span>
        </a>
        <div className="w-9 h-9"></div> {/* spacer */}
      </header>

      {/* Main Pinterest Layout */}
      <div className="max-w-[1016px] mx-auto sm:mt-10 sm:px-6">
        <div className="pin-modal-card mx-auto shadow-sm sm:shadow-lg rounded-none sm:rounded-[32px]" style={{ maxWidth: '100%', display: 'flex', height: 'auto', maxHeight: 'none', overflow: 'hidden', backgroundColor: 'var(--white)' }}>
          <div className="flex flex-col md:flex-row w-full">
            {/* Left Image Col */}
            <div className="w-full md:w-1/2 p-0 sm:p-5 flex items-center justify-center sm:bg-[#F9F9F9]">
              <div className="relative w-full sm:rounded-2xl overflow-hidden sm:shadow-sm" style={{ alignSelf: 'flex-start' }}>
                <img 
                  src={imgSrc} 
                  alt={pinTitle} 
                  className="w-full h-auto object-contain block"
                  style={{ maxHeight: 'calc(100vh - 150px)', borderRadius: '16px' }}
                />
              </div>
            </div>

            {/* Right Meta Col */}
            <div className="w-full md:w-1/2 p-4 sm:p-8 flex flex-col">
              {/* Header Actions */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <button className="icon-btn" onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(pin.url || window.location.href);
                        showToast("Link copied!");
                      }
                    }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                  </button>
                  <a href={pin.url || imgSrc} target="_blank" rel="noopener noreferrer" className="icon-btn" title="View Source">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>
                  </a>
                </div>
                <button className={`pin-hover-save-btn ${isSaved ? "saved" : ""}`} style={{ position: 'static', opacity: 1, height: '44px', padding: '0 20px', fontSize: '15px' }} onClick={handleToggleSave}>
                  {isSaved ? "Saved" : "Save"}
                </button>
              </div>

              {/* Title & Desc */}
              <h1 className="text-3xl font-bold text-[var(--ink)] tracking-tight mb-4 leading-tight">{pinTitle}</h1>
              <p className="text-[var(--text-muted)] text-[15px] leading-relaxed mb-6">{pinDesc}</p>
              
              {/* Creator row */}
              <div className="flex items-center justify-between mb-8 pb-8 border-b border-[var(--border-faint)]">
                <div className="flex items-center gap-3">
                  <img src={avatar} alt={photographer} className="w-12 h-12 rounded-full object-cover shadow-sm" />
                  <div className="flex flex-col">
                    <span className="font-bold text-[var(--ink)] text-[15px]">{photographer}</span>
                    <span className="text-[var(--text-faint)] text-[13px]">{pin.views ? pin.views.toLocaleString() + ' views' : 'Artist'}</span>
                  </div>
                </div>
                <button className="btn btn-ghost rounded-full px-5 h-10 font-bold" onClick={() => showToast("Following author...")}>Follow</button>
              </div>

              {/* Comments Section */}
              <div className="flex-1 flex flex-col min-h-[150px]">
                <h3 className="text-lg font-bold text-[var(--ink)] mb-4">Comments</h3>
                
                {comments.length === 0 ? (
                  <div className="text-[var(--text-faint)] text-sm mb-6 flex-1 italic">No comments yet! Add one to start the conversation.</div>
                ) : (
                  <div className="flex-1 overflow-y-auto mb-6 flex flex-col gap-4 pr-2 max-h-[300px]">
                    {comments.map(c => (
                      <div key={c.id} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--peach)] flex items-center justify-center text-[var(--ink)] font-bold text-xs uppercase shrink-0">
                          {profile?.username ? profile.username.charAt(0) : "U"}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-baseline gap-2">
                            <span className="font-bold text-[13px] text-[var(--ink)]">{profile?.username || "You"}</span>
                            <span className="text-[11px] text-[var(--text-faint)]">{c.date}</span>
                          </div>
                          <span className="text-[14px] text-[var(--text-muted)] mt-0.5">{c.text}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Comment Input */}
                <div className="flex items-center gap-3 mt-auto pt-4 border-t border-[var(--border-faint)]">
                  <div className="w-10 h-10 rounded-full bg-[#FDBB40] text-black flex items-center justify-center font-bold text-sm uppercase shrink-0 shadow-sm">
                    {profile?.username ? profile.username.charAt(0) : "D"}
                  </div>
                  <div className="flex-1 relative">
                    <input 
                      type="text" 
                      placeholder="Add a comment" 
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                      className="w-full bg-black/5 border border-transparent rounded-full px-4 py-2.5 text-[14px] text-[var(--ink)] focus:outline-none focus:bg-white focus:border-[var(--border)] transition-colors"
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Related Pins Grid */}
      {relatedPins.length > 0 && (
        <div className="max-w-[1400px] mx-auto mt-16 px-4 sm:px-6">
          <h2 className="text-xl font-bold text-[var(--ink)] mb-6 text-center">More like this</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {relatedPins.map((rp) => {
              const rpTitle = rp.title || rp.alt || "Aesthetic Moment";
              return (
                <div 
                  key={rp.id} 
                  className="pin-card-wrapper"
                  onClick={() => {
                    sessionStorage.setItem("current_view_pin", JSON.stringify(rp));
                    router.push(`/post/${rp.id}`);
                  }}
                >
                  <div className="pin-image-box">
                    <LazyImage 
                      src={rp.src?.large2x || rp.src?.large || rp.src?.medium || (rp as any).src} 
                      alt={rpTitle} 
                      className="w-full block rounded-2xl"
                      style={rp.width && rp.height ? { aspectRatio: `${rp.width} / ${rp.height}` } : { minHeight: '200px' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="pinterest-toast" role="alert">
          <span className="text-[#805232]">✦</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </main>
  );
}

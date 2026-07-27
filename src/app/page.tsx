"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Head from "next/head";

// Mock Pinterest data (Aesthetic Posters, Graphic Design, Nature)
const MOCK_DATA = [
  { src: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop", alt: "Abstract liquid art", category: "graphic design" },
  { src: "https://images.unsplash.com/photo-1549490349-8643362247b5?q=80&w=600&auto=format&fit=crop", alt: "Modern architecture", category: "aesthetic" },
  { src: "https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?q=80&w=600&auto=format&fit=crop", alt: "Minimalist poster", category: "posters" },
  { src: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=600&auto=format&fit=crop", alt: "Typography design", category: "typography" },
  { src: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=600&auto=format&fit=crop", alt: "Nature landscape", category: "nature" },
  { src: "https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?q=80&w=600&auto=format&fit=crop", alt: "3D render shapes", category: "graphic design" },
  { src: "https://images.unsplash.com/photo-1449844908441-8829872d2607?q=80&w=600&auto=format&fit=crop", alt: "Neon signs", category: "aesthetic" },
  { src: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?q=80&w=600&auto=format&fit=crop", alt: "Vintage poster", category: "posters" },
  { src: "https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?q=80&w=600&auto=format&fit=crop", alt: "Rainy forest", category: "nature" },
  { src: "https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=600&auto=format&fit=crop", alt: "Abstract color blocks", category: "graphic design" },
  { src: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=600&auto=format&fit=crop", alt: "Holographic gradient", category: "graphic design" },
  { src: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=600&auto=format&fit=crop", alt: "Minimal desk setup", category: "aesthetic" },
  { src: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=600&auto=format&fit=crop", alt: "Dark moody nature", category: "nature" },
  { src: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=600&auto=format&fit=crop", alt: "Starry night sky", category: "nature" },
  { src: "https://images.unsplash.com/photo-1524169358666-79f22534bc6e?q=80&w=600&auto=format&fit=crop", alt: "Editorial fashion", category: "posters" },
  { src: "https://images.unsplash.com/photo-1557672172-298e090bd0f1?q=80&w=600&auto=format&fit=crop", alt: "Gradient mesh", category: "graphic design" },
  { src: "https://images.unsplash.com/photo-1515405295579-ba7b45403062?q=80&w=600&auto=format&fit=crop", alt: "Brutalism poster", category: "typography" },
  { src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600&auto=format&fit=crop", alt: "Sunny beach", category: "nature" },
  { src: "https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?q=80&w=600&auto=format&fit=crop", alt: "Abstract geometry", category: "graphic design" },
  { src: "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=600&auto=format&fit=crop", alt: "Cyberpunk neon", category: "aesthetic" },
];

export default function Home() {
  const [pins, setPins] = useState<any[]>([]);
  const [keyword, setKeyword] = useState("all");
  const [page, setPage] = useState(1);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Generate simulated infinite data
  const generatePins = useCallback((currentKeyword: string, currentPage: number) => {
    let filtered = currentKeyword === "all" 
      ? MOCK_DATA 
      : MOCK_DATA.filter(p => p.category === currentKeyword || p.alt.toLowerCase().includes(currentKeyword));
    
    // If no results, just return a random mix so the grid doesn't break
    if (filtered.length === 0) filtered = MOCK_DATA;

    // Simulate an API returning a page of results (we just duplicate our mock data with unique IDs)
    return filtered.map((pin, index) => ({
      ...pin,
      id: `${currentPage}-${index}-${Math.random()}`
    }));
  }, []);

  // Initial load or keyword change
  useEffect(() => {
    setPins(generatePins(keyword, 1));
    setPage(1);
  }, [keyword, generatePins]);

  // Infinite Scroll Observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setPage(prev => {
          const next = prev + 1;
          setPins(current => [...current, ...generatePins(keyword, next)]);
          return next;
        });
      }
    }, { rootMargin: '200px' }); // Trigger 200px before reaching the bottom

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [keyword, generatePins]);

  return (
    <div className="pinterest-layout">
      {/* ── TOP HEADER ── */}
      <header className="pt-header">
        <div className="pt-logo">
          <svg className="pt-icon-logo" height="24" width="24" viewBox="0 0 24 24" aria-hidden="true" aria-label="Pinterest" role="img">
            <path fill="#E60023" d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.951-7.252 4.182 0 7.436 2.982 7.436 6.96 0 4.156-2.617 7.502-6.255 7.502-1.22 0-2.368-.635-2.763-1.386l-.754 2.874c-.273 1.042-1.01 2.348-1.505 3.143A11.967 11.967 0 0012 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"></path>
          </svg>
        </div>

        <div className="pt-nav-links">
          <button className={`pt-nav-btn ${keyword === 'all' ? 'active' : ''}`} onClick={() => setKeyword('all')}>Home</button>
          <button className="pt-nav-btn" onClick={() => setKeyword('explore')}>Explore</button>
          <button className="pt-nav-btn" onClick={() => setKeyword('create')}>Create</button>
        </div>

        <div className="pt-search-bar">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input 
            type="search" 
            placeholder="Search for aesthetic posters, nature..." 
            onChange={(e) => {
              if (e.target.value.length > 2 || e.target.value === '') {
                setKeyword(e.target.value || 'all');
              }
            }}
          />
        </div>

        <div className="pt-actions">
          <button className="pt-icon-btn" aria-label="Notifications">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 24c1.66 0 3-1.34 3-3H9c0 1.66 1.34 3 3 3zm6-5V13c0-3.07-1.63-5.64-4.5-6.32V6c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 7.36 6 9.92 6 13v6H4v2h16v-2h-2z"/>
            </svg>
          </button>
          <button className="pt-icon-btn" aria-label="Messages">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12c0 2.5.93 4.79 2.47 6.54.12.14.17.33.12.52l-.84 2.82c-.14.47.3.91.77.77l2.82-.84c.19-.05.38 0 .52.12C9.21 23.07 10.5 24 12 24c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.32 0-2.58-.3-3.7-.82l-3.32.99.99-3.32C5.3 15.58 5 13.82 5 12c0-3.86 3.14-7 7-7s7 3.14 7 7-3.14 7-7 7z"/>
            </svg>
          </button>
          <button className="pt-profile-btn" onClick={() => window.location.href = '/auth'}>
            <div className="pt-avatar">U</div>
          </button>
          <button className="pt-icon-btn pt-dropdown-btn">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>
          </button>
        </div>
      </header>

      {/* ── FILTER CHIPS (Pinterest Explore Style) ── */}
      <div className="pt-chip-bar">
        {["graphic design", "aesthetic", "posters", "typography", "nature"].map((cat) => (
          <button key={cat} className={`pt-chip ${keyword === cat ? 'active' : ''}`} onClick={() => setKeyword(cat)}>
            {cat}
          </button>
        ))}
      </div>

      {/* ── MASONRY GRID ── */}
      <main className="pt-main">
        <div className="pt-grid">
          {pins.map((pin) => (
            <div key={pin.id} className="pt-pin">
              <img src={pin.src} alt={pin.alt} loading="lazy" />
              <div className="pt-pin-overlay">
                <button className="pt-save-btn">Save</button>
                <div className="pt-bottom-actions">
                  <a href="#" className="pt-visit-btn">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M19 19H5V5h7V3H5a2 2 0 00-2 2v14a2 2 0 002 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>
                    Visit site
                  </a>
                  <div className="pt-icon-group">
                    <button className="pt-circle-btn" aria-label="Share">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>
                    </button>
                    <button className="pt-circle-btn" aria-label="More">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Infinite Scroll Trigger */}
        <div ref={loadMoreRef} className="pt-loading-spinner">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E60023" strokeWidth="3" className="spin">
            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10" />
          </svg>
        </div>
      </main>

      {/* ── MOBILE BOTTOM TAB BAR ── */}
      <nav className="pt-mobile-nav">
        <button className="pt-mobile-tab active">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
        </button>
        <button className="pt-mobile-tab">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
        </button>
        <button className="pt-mobile-tab">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
        </button>
        <button className="pt-mobile-tab">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
        </button>
        <button className="pt-mobile-tab" onClick={() => window.location.href = '/auth'}>
          <div className="pt-avatar-small">U</div>
        </button>
      </nav>
    </div>
  );
}

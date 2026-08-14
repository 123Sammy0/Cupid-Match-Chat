"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { fetchPexelsImages } from "@/app/actions/pexels";
import { fetchPixabayImages } from "@/app/actions/pixabay";
import { LazyImage } from "@/app/components/LazyImage";
import { PinDetailModal, PinItem } from "@/app/components/PinDetailModal";
import { getProfile } from "@/app/actions/settings";

const AESTHETIC_KEYWORDS = [
  "Aesthetic vintage books and coffee", "Quiet reading corner morning light",
  "Warm poetry book pages typography", "Cozy library aesthetic books desk",
  "Nature calm forest sunlight aesthetic", "Vintage journal handwritten aesthetic",
  "Minimalist architecture stone arch", "Golden hour sunset gentle shadows",
  "Warm tea cup open book aesthetic", "Antique bookstore shelf calm",
  "Botanical leaves soft lighting", "Old paper handwritten notes minimal"
];

const CATEGORY_MAPPINGS: Record<string, string[]> = {
  "reading now": ["Vintage books reading aesthetic", "Reading corner coffee book", "Open book table warm"],
  "quiet places": ["Quiet cozy cottage window", "Calm nature forest sunlight", "Peaceful library nook"],
  "quotes": ["Aesthetic typography quotes journal", "Typewriter text quote minimal", "Poetry verses book aesthetic"],
  "collections": ["Art gallery minimal sculpture", "Curated vintage stationery", "Aesthetic botanical collection"],
  "notes": ["Handwritten journal notes aesthetic", "Fountain pen paper writing", "Warm coffee desk study"],
  "classics": ["Classic leather books shelf", "Old library antique literature", "Vintage academia aesthetic"],
  "weekend": ["Unhurried weekend coffee breakfast", "Lazy sunday reading light", "Gentle walk nature path"]
};

const CATEGORIES = [
  { label: "All", value: "all" },
  { label: "Reading now", value: "reading now" },
  { label: "Quiet places", value: "quiet places" },
  { label: "Quotes", value: "quotes" },
  { label: "Collections", value: "collections" },
  { label: "Notes", value: "notes" },
  { label: "Classics", value: "classics" },
  { label: "Weekend", value: "weekend" }
];

const shuffleArray = (array: any[]) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

const deduplicatePins = (pins: any[]) => {
  const seen = new Set();
  return pins.filter(pin => {
    const key = pin.src?.large2x || pin.src?.large || pin.src || pin.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [pins, setPins] = useState<PinItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [numCols, setNumCols] = useState(5);
  
  // Pinterest Modal & Saved State
  const [selectedPin, setSelectedPin] = useState<PinItem | null>(null);
  const [selectedPinIndex, setSelectedPinIndex] = useState<number>(-1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savedPinIds, setSavedPinIds] = useState<Set<string | number>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Scroll visibility and profile state
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const lastScrollY = useRef(0);

  // Scroll listener for header auto-hide/show (slide & fade up/down)
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 80) {
        setIsHeaderVisible(false);
        setIsProfileMenuOpen(false);
      } else if (currentScrollY < lastScrollY.current) {
        setIsHeaderVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch profile
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem("cupid_cache_profile");
      if (cached) {
        setProfile(JSON.parse(cached));
      }
    } catch {
      // Ignore
    }
    const fetchProfile = async () => {
      try {
        const data = await getProfile();
        if (data) {
          setProfile(data);
          sessionStorage.setItem("cupid_cache_profile", JSON.stringify(data));
        }
      } catch {
        // Ignore
      }
    };
    fetchProfile();
  }, []);

  // Load saved pin IDs from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("saved_pins");
      if (stored) {
        setSavedPinIds(new Set(JSON.parse(stored)));
      }
    } catch {
      // Ignore
    }
  }, []);

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const toggleSavePin = (pin: PinItem) => {
    setSavedPinIds(prev => {
      const next = new Set(prev);
      const pinId = pin.id;
      if (next.has(pinId)) {
        next.delete(pinId);
        showToast("Removed from your saved collection");
      } else {
        next.add(pinId);
        showToast("Saved to your collection board ✦");
      }
      try {
        localStorage.setItem("saved_pins", JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  const openPinDetail = (pin: PinItem) => {
    try {
      sessionStorage.setItem("current_view_pin", JSON.stringify(pin));
    } catch {}
    router.push(`/post/${pin.id}`);
  };

  const handlePrevPin = () => {
    if (selectedPinIndex > 0) {
      const nextIndex = selectedPinIndex - 1;
      setSelectedPinIndex(nextIndex);
      setSelectedPin(pins[nextIndex]);
    }
  };

  const handleNextPin = () => {
    if (selectedPinIndex < pins.length - 1) {
      const nextIndex = selectedPinIndex + 1;
      setSelectedPinIndex(nextIndex);
      setSelectedPin(pins[nextIndex]);
    }
  };

  const handleTagSearch = (tag: string) => {
    setActiveCategory('all');
    setActiveSearch(tag);
    setSearchQuery(tag);
    document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const updateCols = () => {
      if (window.innerWidth < 640) setNumCols(2);
      else if (window.innerWidth < 1024) setNumCols(3);
      else if (window.innerWidth < 1280) setNumCols(4);
      else setNumCols(5);
    };
    updateCols();
    window.addEventListener("resize", updateCols);
    return () => window.removeEventListener("resize", updateCols);
  }, []);

  // Keyboard shortcut to private gate (Shift + . or Shift + >)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.key === '>' || e.key === '.')) {
        window.location.href = '/gate';
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Split pins evenly into columns
  const columnArrays = Array.from({ length: numCols }, () => [] as PinItem[]);
  pins.forEach((pin, i) => columnArrays[i % numCols].push(pin));

  const toggleDrawer = () => setDrawerOpen(prev => !prev);

  // Initial load or filter change
  useEffect(() => {
    let isMounted = true;
    const fetchInitial = async () => {
      setIsLoading(true);
      
      const fetchMix = async (q1: string, q2: string, p1: number, p2: number) => {
        const [px, pb] = await Promise.all([
          fetchPexelsImages(q1, p1, 15),
          fetchPixabayImages(q2, p2, 15)
        ]);
        return shuffleArray([...(px.photos || []), ...(pb.photos || [])]);
      };

      let photos: any[] = [];
      if (activeSearch) {
        photos = await fetchMix(`${activeSearch} aesthetic books`, `${activeSearch} aesthetic`, 1, 1);
      } else if (activeCategory === 'all') {
        const shuffled = shuffleArray(AESTHETIC_KEYWORDS);
        const r1 = Math.floor(Math.random() * 4) + 1;
        const r2 = Math.floor(Math.random() * 4) + 1;
        photos = await fetchMix(shuffled[0], shuffled[1], r1, r2);
      } else {
        const mapped = CATEGORY_MAPPINGS[activeCategory] || [`${activeCategory} aesthetic`];
        const shuffled = shuffleArray(mapped);
        const q1 = shuffled[0];
        const q2 = shuffled.length > 1 ? shuffled[1] : shuffled[0];
        const r1 = Math.floor(Math.random() * 3) + 1;
        const r2 = Math.floor(Math.random() * 3) + 1;
        photos = await fetchMix(q1, q2, r1, r2);
      }

      if (isMounted) {
        const unique = deduplicatePins(photos);
        if (unique.length > 0) {
          setPins(unique);
          setPage(2);
          setHasMore(true);
        } else {
          setPins([]);
          setHasMore(false);
        }
        setIsLoading(false);
      }
    };

    fetchInitial();
    return () => { isMounted = false; };
  }, [activeSearch, activeCategory]);

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !isLoading) {
        const fetchMore = async () => {
          setIsLoading(true);
          
          const fetchMix = async (q1: string, q2: string, p1: number, p2: number) => {
            const [px, pb] = await Promise.all([
              fetchPexelsImages(q1, p1, 15),
              fetchPixabayImages(q2, p2, 15)
            ]);
            return shuffleArray([...(px.photos || []), ...(pb.photos || [])]);
          };

          let newPhotos: any[] = [];
          if (activeSearch) {
            newPhotos = await fetchMix(`${activeSearch} aesthetic books`, `${activeSearch} aesthetic`, page, page);
          } else if (activeCategory === 'all') {
            const shuffled = shuffleArray(AESTHETIC_KEYWORDS);
            newPhotos = await fetchMix(shuffled[0], shuffled[1], page, page);
          } else {
            const mapped = CATEGORY_MAPPINGS[activeCategory] || [`${activeCategory} aesthetic`];
            const shuffled = shuffleArray(mapped);
            const q1 = shuffled[0];
            const q2 = shuffled.length > 1 ? shuffled[1] : shuffled[0];
            newPhotos = await fetchMix(q1, q2, page, page);
          }
          
          if (newPhotos.length > 0) {
            setPins(current => deduplicatePins([...current, ...newPhotos]));
            setPage(prev => prev + 1);
          } else {
            setHasMore(false);
          }
          setIsLoading(false);
        };
        fetchMore();
      }
    }, { rootMargin: '1000px' });
    
    if (loadMoreRef.current) observerRef.current.observe(loadMoreRef.current);
    
    return () => observerRef.current?.disconnect();
  }, [hasMore, isLoading, page, activeSearch, activeCategory]);

  return (
    <main id="libraryView" className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* Top bar */}
      <header className={`topbar ${isHeaderVisible ? "" : "topbar-hidden"}`} role="banner">
        <div className="topbar-left">
          <button 
            className="hamburger" 
            id="mobileMenu" 
            aria-label="Open navigation" 
            aria-expanded={isDrawerOpen} 
            onClick={toggleDrawer}
          >
            <span></span><span></span><span></span>
          </button>
          <a className="brand" href="#top" aria-label="Little Library home">
            little library<span className="brand-dot">.</span>
          </a>
        </div>

        {/* Search */}
        <form 
          className="search-wrap" 
          role="search" 
          onSubmit={(e) => { 
            e.preventDefault(); 
            setActiveCategory('all'); 
            setActiveSearch(searchQuery); 
          }}
        >
          <span 
            className="search-icon" 
            aria-hidden="true" 
            onClick={() => { setActiveCategory('all'); setActiveSearch(searchQuery); }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </span>
          <label htmlFor="searchInput" className="sr-only">Search books, quotes, notes</label>
          <input 
            type="search" 
            id="searchInput" 
            placeholder="Search books, quotes, notes…" 
            autoComplete="off"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          
          {/* Camera and Microphone inside the search pill */}
          <div className="search-actions-inside">
            <button 
              type="button" 
              className="search-inside-btn" 
              title="Search by image"
              onClick={() => showToast("Visual search coming soon...")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
                <circle cx="18.5" cy="17.5" r="0.5" fill="currentColor"/>
              </svg>
            </button>
            <button 
              type="button" 
              className="search-inside-btn" 
              title="Search by voice"
              onClick={() => showToast("Voice audio search coming soon...")}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                <path d="M19 10v1a7 7 0 0 1-14 0v-1"/>
                <line x1="12" x2="12" y1="19" y2="22"/>
              </svg>
            </button>
          </div>
        </form>

        {/* Right actions */}
        <div className="topbar-right">
          <nav className="topnav" aria-label="Primary navigation">
            <a href="#shelves" className="nav-link active">Browse</a>
            <a href="#collection" className="nav-link">Collections</a>
            <a href="#notes" className="nav-link">Notes</a>
          </nav>

          <button 
            className="icon-btn relative" 
            aria-label="Saved items"
            onClick={() => {
              if (savedPinIds.size > 0) {
                showToast(`You have ${savedPinIds.size} saved pin${savedPinIds.size > 1 ? 's' : ''}`);
              } else {
                showToast("Click 'Save' on any pin to start your collection!");
              }
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={savedPinIds.size > 0 ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
            </svg>
            {savedPinIds.size > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#805232] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {savedPinIds.size}
              </span>
            )}
          </button>

          {/* Discreet private entrance */}
          <button 
            className="icon-btn quiet-door-btn" 
            id="quietDoor" 
            aria-label="Private entry" 
            title="Private room (Shift+.)" 
            onClick={() => window.location.href = '/gate'}
          >
            <span className="quiet-star" aria-hidden="true">✦</span>
          </button>

        </div>
      </header>

      {/* Mobile Drawer */}
      <div className="mobile-drawer" id="mobileDrawer" aria-hidden={!isDrawerOpen} aria-label="Mobile navigation">
        <nav>
          <a href="#shelves" onClick={() => setDrawerOpen(false)}>Browse</a>
          <a href="#collection" onClick={() => setDrawerOpen(false)}>Collections</a>
          <a href="#notes" onClick={() => setDrawerOpen(false)}>Notes</a>
        </nav>
      </div>
      <div 
        className={`drawer-overlay ${isDrawerOpen ? 'visible' : ''}`} 
        id="drawerOverlay" 
        aria-hidden={!isDrawerOpen} 
        onClick={toggleDrawer}
      />

      {/* Category chip bar */}
      <div className={`chip-bar ${isHeaderVisible ? "" : "chip-bar-hidden"}`} id="shelves" role="navigation" aria-label="Browse by category">
        <div className="chip-bar-inner">
          <div className="chip-scroll">
            {CATEGORIES.map((cat) => (
              <button 
                key={cat.value} 
                className={`chip ${activeCategory === cat.value && !activeSearch ? "active" : ""}`} 
                onClick={() => {
                  setActiveSearch("");
                  setSearchQuery("");
                  setActiveCategory(cat.value);
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hero Section */}
      {activeCategory === 'all' && !activeSearch && (
        <section className="hero" id="top" aria-label="Welcome">
          <div className="hero-text">
            <span className="eyebrow">A private collection of slow things</span>
            <h1>
              Pages to keep,<br />
              <em>places to return&nbsp;to.</em>
            </h1>
            <p className="hero-sub">
              A small shelf of books, thoughts, and gentle visual notes for unhurried days.
            </p>
            <div className="hero-actions">
              <button 
                className="btn btn-primary"
                onClick={() => document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Explore collection
              </button>
              <button 
                className="btn btn-ghost"
                onClick={() => document.getElementById('shelves')?.scrollIntoView({ behavior: 'smooth' })}
              >
                View shelves
              </button>
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="hero-card hero-card-1">
              <img 
                src="https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=500" 
                alt="Books on a shelf" 
                loading="eager" 
              />
            </div>
            <div className="hero-card hero-card-2">
              <img 
                src="https://images.pexels.com/photos/762687/pexels-photo-762687.jpeg?auto=compress&cs=tinysrgb&w=500" 
                alt="Open book with coffee" 
                loading="eager" 
              />
            </div>
            <div className="hero-card hero-card-3">
              <img 
                src="https://images.pexels.com/photos/1029141/pexels-photo-1029141.jpeg?auto=compress&cs=tinysrgb&w=300" 
                alt="Reading nook" 
                loading="eager" 
              />
            </div>
          </div>
        </section>
      )}

      {/* Pinterest Masonry Pin Stream */}
      <section className="pins-section" id="collection" aria-label="Books and inspiration">
        <div className="flex justify-center w-full" style={{ gap: '16px', alignItems: 'flex-start' }} id="pinsGrid" role="list" aria-label="Pin collection">
          {columnArrays.map((colPins, colIndex) => (
            <div key={colIndex} className="flex flex-col flex-1 min-w-0" style={{ gap: '16px' }}>
              {colPins.map((pin) => {
                const isSaved = savedPinIds.has(pin.id);
                const title = pin.title || pin.alt || "Aesthetic Moment";
                const photographer = pin.photographer || "Curated Artist";
                const domain = pin.provider === "pixabay" ? "pixabay.com" : pin.provider === "pexels" ? "pexels.com" : "library.art";
                const avatar = pin.photographer_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(photographer)}&backgroundColor=e8d98a,c48a6e,4f8b6e`;

                return (
                  <div 
                    key={pin.id} 
                    className="pin-card-wrapper"
                    onClick={() => openPinDetail(pin)}
                  >
                    {/* Visual Card Image Box */}
                    <div className="pin-image-box">
                      <LazyImage 
                        src={pin.src?.large2x || pin.src?.large || (pin as any).src} 
                        alt={title} 
                        className="w-full block"
                        style={pin.width && pin.height ? { aspectRatio: `${pin.width} / ${pin.height}` } : { minHeight: '260px' }}
                      />

                      {/* Pinterest Hover Actions Overlay */}
                      <div className="pin-overlay">
                        {/* Top Right Red Save Button */}
                        <button 
                          className={`pin-hover-save-btn ${isSaved ? "saved" : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSavePin(pin);
                          }}
                        >
                          {isSaved ? "Saved" : "Save"}
                        </button>
                        
                        {/* Bottom Action Bar */}
                        <div className="pin-hover-bottom-bar">
                          <a 
                            href={pin.url || "#"} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="pin-hover-source-pill"
                            onClick={(e) => e.stopPropagation()}
                            title={`Visit ${domain}`}
                          >
                            <span>{domain}</span>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M7 17L17 7M17 7H7M17 7V17"/>
                            </svg>
                          </a>

                          <div className="flex items-center gap-1.5">
                            {/* Share button */}
                            <button 
                              className="pin-hover-icon-btn"
                              aria-label="Share pin"
                              title="Share"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (navigator.clipboard) {
                                  navigator.clipboard.writeText(pin.url || window.location.href);
                                  showToast("Pin link copied to clipboard!");
                                }
                              }}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Pinterest Meta: Title & Creator Underneath */}
                    <div className="pin-card-meta">
                      <h2 className="pin-card-title">{title}</h2>
                      <div className="pin-card-author-row">
                        <img 
                          src={avatar} 
                          alt={photographer} 
                          className="pin-card-author-avatar" 
                        />
                        <span className="pin-card-author-name">{photographer}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        
        {/* Infinite loader */}
        <div ref={loadMoreRef} className="load-more-wrap" style={{ padding: '40px 0', textAlign: 'center', minHeight: '80px' }}>
          {isLoading && (
            <button className="btn btn-ghost" disabled style={{ opacity: 0.8, cursor: 'default' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite', marginRight: '8px', display: 'inline-block' }}>
                <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10" />
              </svg>
              Discovering more pages...
            </button>
          )}
          {!hasMore && pins.length > 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic' }}>
              You have reached the end of the shelf.
            </p>
          )}
        </div>
      </section>

      {/* Shelf note & footer door */}
      <section className="shelf-note" id="notes" aria-label="Library footer note">
        <p className="shelf-text">Saved slowly, read often, shared quietly.</p>
        <div className="shelf-divider" aria-hidden="true"></div>
        <button 
          className="shelf-door" 
          id="quietDoor2" 
          aria-label="Open private room" 
          onClick={() => window.location.href = '/gate'}
        >
          <span aria-hidden="true">✦</span>
        </button>
      </section>

      {/* Footer */}
      <footer className="site-footer" role="contentinfo">
        <p className="footer-brand">little library<span style={{ color: 'var(--peach)' }}>.</span></p>
        <p className="footer-copy">A curated private collection for two.</p>
      </footer>


      {/* Toast Alert Feedback */}
      {toastMessage && (
        <div className="pinterest-toast" role="alert">
          <span className="text-[#805232]">✦</span>
          <span>{toastMessage}</span>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </main>
  );
}

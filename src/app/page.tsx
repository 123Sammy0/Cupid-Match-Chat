"use client";

import { useEffect, useState, useRef } from "react";
import Head from "next/head";
import { fetchPexelsImages } from "@/app/actions/pexels";

export default function Home() {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [pins, setPins] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [numCols, setNumCols] = useState(5);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const updateCols = () => {
      if (window.innerWidth < 640) setNumCols(2);
      else if (window.innerWidth < 1000) setNumCols(3);
      else if (window.innerWidth < 1280) setNumCols(4);
      else setNumCols(5);
    };
    updateCols();
    window.addEventListener("resize", updateCols);
    return () => window.removeEventListener("resize", updateCols);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.key === '>' || e.key === '.')) {
        window.location.href = '/gate';
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Split pins into columns
  const columnArrays = Array.from({ length: numCols }, () => [] as any[]);
  pins.forEach((pin, i) => columnArrays[i % numCols].push(pin));

  const toggleDrawer = () => setDrawerOpen(!isDrawerOpen);

  // Initial load or category change
  useEffect(() => {
    let isMounted = true;
    const fetchInitial = async () => {
      setIsLoading(true);
      const query = activeCategory === 'all' 
        ? 'aesthetic quotes' 
        : (activeCategory.includes('quotes') ? activeCategory : `${activeCategory} quotes`);
      const res = await fetchPexelsImages(query, 1, 15);
      if (isMounted) {
        if (res.photos && res.photos.length > 0) {
          setPins(res.photos);
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
  }, [activeCategory]);

  // Infinite Scroll Intersection Observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !isLoading) {
        const fetchMore = async () => {
          setIsLoading(true);
          const query = activeCategory === 'all' 
            ? 'aesthetic quotes' 
            : (activeCategory.includes('quotes') ? activeCategory : `${activeCategory} quotes`);
          const res = await fetchPexelsImages(query, page, 15);
          
          if (res.photos && res.photos.length > 0) {
            setPins(current => {
              // Deduplicate by ID just in case
              const existingIds = new Set(current.map(p => p.id));
              const newPhotos = res.photos.filter((p: any) => !existingIds.has(p.id));
              return [...current, ...newPhotos];
            });
            setPage(prev => prev + 1);
          } else {
            setHasMore(false);
          }
          setIsLoading(false);
        };
        fetchMore();
      }
    }, { rootMargin: '1200px' });
    
    if (loadMoreRef.current) observerRef.current.observe(loadMoreRef.current);
    
    return () => observerRef.current?.disconnect();
  }, [hasMore, isLoading, page, activeCategory]);

  return (
    <>
      <header className="topbar" role="banner">
        <div className="topbar-left">
          <button className="hamburger" id="mobileMenu" aria-label="Open navigation" aria-expanded={isDrawerOpen} onClick={toggleDrawer}>
            <span></span><span></span><span></span>
          </button>
          <a className="brand" href="#top" aria-label="Little Library home">
            little library<span className="brand-dot" style={{color: "var(--red)"}}>.</span>
          </a>
        </div>
        <div className="search-wrap" role="search">
          <span className="search-icon" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </span>
          <label htmlFor="searchInput" className="sr-only">Search skies, nature, sunsets</label>
          <input type="search" id="searchInput" placeholder="Search skies, nature, sunsets…" autoComplete="off" />
        </div>
        <div className="topbar-right">
          <nav className="topnav" aria-label="Primary navigation">
            <a href="#shelves" className="nav-link active">Browse</a>
            <a href="#collection" className="nav-link">Collections</a>
            <a href="#notes" className="nav-link">Notes</a>
          </nav>
          <button className="icon-btn" aria-label="Saved items">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
            </svg>
          </button>
          <button className="icon-btn quiet-door-btn" id="quietDoor" aria-label="Private entry" title="Private room (Shift+.)" onClick={() => window.location.href = '/gate'}>
            <span className="quiet-star" aria-hidden="true">✦</span>
          </button>
        </div>
      </header>

      <div className="mobile-drawer" id="mobileDrawer" aria-hidden={!isDrawerOpen} aria-label="Mobile navigation">
        <nav>
          <a href="#shelves">Browse</a>
          <a href="#collection">Collections</a>
          <a href="#notes">Notes</a>
        </nav>
      </div>
      <div className={`drawer-overlay ${isDrawerOpen ? 'visible' : ''}`} id="drawerOverlay" aria-hidden={!isDrawerOpen} onClick={toggleDrawer}></div>

      <div className="chip-bar" id="shelves" role="navigation" aria-label="Browse by category">
        <div className="chip-scroll">
          {["All", "Aesthetic Quotes", "Motivational", "Study", "Short Quotes", "Life", "Inspirational", "Meaningful"].map((cat) => (
            <button key={cat} className={`chip ${activeCategory === cat.toLowerCase() ? "active" : ""}`} onClick={() => setActiveCategory(cat.toLowerCase())}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      <section className="hero" id="top" aria-label="Welcome">
        <div className="hero-text">
          <p className="eyebrow">A private collection of slow things</p>
          <h1>Pages to keep,<br /><em>places to return&nbsp;to.</em></h1>
          <p className="hero-sub">A small shelf of books, thoughts, and gentle visual notes for unhurried days.</p>
          <div className="hero-actions">
            <button 
              className="btn btn-primary" 
              style={{backgroundColor: "var(--red)"}}
              onClick={() => document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Explore collection
            </button>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="hero-card hero-card-1"><img src="https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=500" alt="Books" loading="eager" /></div>
          <div className="hero-card hero-card-2"><img src="https://images.pexels.com/photos/762687/pexels-photo-762687.jpeg?auto=compress&cs=tinysrgb&w=500" alt="Coffee" loading="eager" /></div>
          <div className="hero-card hero-card-3"><img src="https://images.pexels.com/photos/1029141/pexels-photo-1029141.jpeg?auto=compress&cs=tinysrgb&w=300" alt="Nook" loading="eager" /></div>
        </div>
      </section>

      <section className="pins-section" id="collection" aria-label="Books and inspiration">
        <div className="flex justify-center w-full" style={{ gap: '14px', alignItems: 'flex-start' }} id="pinsGrid" role="list" aria-label="Pin collection">
          {columnArrays.map((colPins, colIndex) => (
            <div key={colIndex} className="flex flex-col flex-1 min-w-0" style={{ gap: '14px' }}>
              {colPins.map((pin) => (
                <div key={pin.id} className="pin-card" style={{position: 'relative', margin: 0, breakInside: 'avoid'}}>
                  <img src={pin.src?.large2x || pin.src?.large || pin.src} alt={pin.alt || "Aesthetic"} loading="lazy" style={{display: 'block', width: '100%', borderRadius: '16px'}} />

                  <div className="pin-overlay" style={{
                    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', opacity: 0, 
                    transition: 'opacity 0.2s', display: 'flex', flexDirection: 'column', 
                    justifyContent: 'space-between', padding: '12px', borderRadius: '16px'
                  }}>
                    <button style={{
                      alignSelf: 'flex-end', background: 'var(--red)', color: 'white', border: 'none', 
                      borderRadius: '24px', padding: '10px 16px', fontWeight: 'bold', cursor: 'pointer'
                    }}>Save</button>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <a href={pin.url || "#"} target="_blank" rel="noopener noreferrer" style={{
                        background: 'rgba(255,255,255,0.9)', color: 'black', padding: '8px 12px', 
                        borderRadius: '20px', fontWeight: 'bold', fontSize: '12px', textDecoration: 'none'
                      }}>Visit site</a>
                      <button style={{width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer'}}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="black" style={{margin: 'auto'}}><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
        
        <div ref={loadMoreRef} className="load-more-wrap" style={{padding: '40px 0', textAlign: 'center', minHeight: '100px'}}>
          {isLoading && (
            <button className="btn btn-ghost" disabled style={{ opacity: 0.7, cursor: 'default' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{animation: 'spin 1s linear infinite', marginRight: '8px', display: 'inline-block'}}>
                <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10" />
              </svg>
              Loading more images...
            </button>
          )}
          {!hasMore && pins.length > 0 && <p style={{color: 'var(--text-muted)'}}>You've reached the end.</p>}
        </div>
      </section>

      <section className="shelf-note" id="notes" aria-label="Library footer note">
        <p className="shelf-text">Saved slowly, read often, shared quietly.</p>
        <div className="shelf-divider" aria-hidden="true"></div>
        <button className="shelf-door" id="quietDoor2" aria-label="Open private room" onClick={() => window.location.href = '/gate'}>
          <span aria-hidden="true">✦</span>
        </button>
      </section>

      <footer className="site-footer" role="contentinfo">
        <p className="footer-brand">little library<span style={{color: 'var(--red)'}}>.</span></p>
        <p className="footer-copy">A curated private collection.</p>
      </footer>
      
      <style dangerouslySetInnerHTML={{__html: `
        .pin:hover .pin-overlay { opacity: 1 !important; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </>
  );
}

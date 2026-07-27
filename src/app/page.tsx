"use client";

import { useEffect, useState } from "react";
import Head from "next/head";

const PINS = [
  { id: 1, src: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=600&auto=format&fit=crop", alt: "Book reading", category: "reading now" },
  { id: 2, src: "https://images.unsplash.com/photo-1455390582262-044cdead27d8?q=80&w=600&auto=format&fit=crop", alt: "Coffee and book", category: "weekend" },
  { id: 3, src: "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=600&auto=format&fit=crop", alt: "Library", category: "quiet places" },
  { id: 4, src: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?q=80&w=600&auto=format&fit=crop", alt: "Books pile", category: "collections" },
  { id: 5, src: "https://images.unsplash.com/photo-1524578971036-7c98f80cb8e0?q=80&w=600&auto=format&fit=crop", alt: "Journaling", category: "notes" },
  { id: 6, src: "https://images.unsplash.com/photo-1476275466078-4007374efac4?q=80&w=600&auto=format&fit=crop", alt: "Vintage books", category: "classics" },
  { id: 7, src: "https://images.unsplash.com/photo-1589998059171-989d887dda6e?q=80&w=600&auto=format&fit=crop", alt: "Open dictionary", category: "classics" },
  { id: 8, src: "https://images.unsplash.com/photo-1511108690759-009324a90311?q=80&w=600&auto=format&fit=crop", alt: "Letter", category: "quotes" },
  { id: 9, src: "https://images.unsplash.com/photo-1535905557558-afc4877a26fc?q=80&w=600&auto=format&fit=crop", alt: "Bookstore", category: "collections" },
  { id: 10, src: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=600&auto=format&fit=crop", alt: "Reading book", category: "reading now" },
  { id: 11, src: "https://images.unsplash.com/photo-1463320726281-696a485928c7?q=80&w=600&auto=format&fit=crop", alt: "Typewriter", category: "notes" },
  { id: 12, src: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?q=80&w=600&auto=format&fit=crop", alt: "Wooden desk", category: "quiet places" },
  { id: 13, src: "https://images.unsplash.com/photo-1555679427-1f6dfcce943b?q=80&w=600&auto=format&fit=crop", alt: "Rainy window", category: "weekend" },
  { id: 14, src: "https://images.unsplash.com/photo-1519682337058-a94d519337bc?q=80&w=600&auto=format&fit=crop", alt: "Pages", category: "quotes" },
  { id: 15, src: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=600&auto=format&fit=crop", alt: "Stacked books", category: "collections" },
  { id: 16, src: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=600&auto=format&fit=crop", alt: "Book open", category: "classics" },
  { id: 17, src: "https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?q=80&w=600&auto=format&fit=crop", alt: "Glasses and book", category: "reading now" },
  { id: 18, src: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=600&auto=format&fit=crop", alt: "Library shelves", category: "quiet places" },
  { id: 19, src: "https://images.unsplash.com/photo-1474366521946-c3d4b507abf2?q=80&w=600&auto=format&fit=crop", alt: "Writing desk", category: "notes" },
  { id: 20, src: "https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=600&auto=format&fit=crop", alt: "Notebooks", category: "weekend" },
];

export default function Home() {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [visibleCount, setVisibleCount] = useState(10);

  const toggleDrawer = () => setDrawerOpen(!isDrawerOpen);

  // Smooth scroll helper
  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Filter and pagination logic
  const filteredPins = activeCategory === "all" 
    ? PINS 
    : PINS.filter(pin => pin.category === activeCategory);

  const displayedPins = filteredPins.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPins.length;

  return (
    <>
      {/* Top bar */}
      <header className="topbar" role="banner">
        <div className="topbar-left">
          <button className="hamburger" id="mobileMenu" aria-label="Open navigation" aria-expanded={isDrawerOpen} onClick={toggleDrawer}>
            <span></span><span></span><span></span>
          </button>
          <a className="brand" href="#top" aria-label="Little Library home" onClick={(e) => { e.preventDefault(); scrollTo('top'); }}>
            little library<span className="brand-dot">.</span>
          </a>
        </div>

        {/* Search */}
        <div className="search-wrap" role="search">
          <span className="search-icon" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </span>
          <label htmlFor="searchInput" className="sr-only">Search books, quotes, notes</label>
          <input type="search" id="searchInput" placeholder="Search books, quotes, notes…" autoComplete="off" />
        </div>

        {/* Right actions */}
        <div className="topbar-right">
          <nav className="topnav" aria-label="Primary navigation">
            <a href="#shelves" className="nav-link active" onClick={(e) => { e.preventDefault(); scrollTo('shelves'); }}>Browse</a>
            <a href="#collection" className="nav-link" onClick={(e) => { e.preventDefault(); scrollTo('collection'); }}>Collections</a>
            <a href="#notes" className="nav-link" onClick={(e) => { e.preventDefault(); scrollTo('notes'); }}>Notes</a>
          </nav>

          <button className="icon-btn" aria-label="Saved items">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
            </svg>
          </button>

          {/* Discreet private entry — ✦ */}
          <button className="icon-btn quiet-door-btn" id="quietDoor" aria-label="Private entry" title="Private room (Shift+.)" onClick={() => window.location.href = '/gate'}>
            <span className="quiet-star" aria-hidden="true">✦</span>
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <div className="mobile-drawer" id="mobileDrawer" aria-hidden={!isDrawerOpen} aria-label="Mobile navigation">
        <nav>
          <a href="#shelves" onClick={(e) => { e.preventDefault(); toggleDrawer(); scrollTo('shelves'); }}>Browse</a>
          <a href="#collection" onClick={(e) => { e.preventDefault(); toggleDrawer(); scrollTo('collection'); }}>Collections</a>
          <a href="#notes" onClick={(e) => { e.preventDefault(); toggleDrawer(); scrollTo('notes'); }}>Notes</a>
        </nav>
      </div>
      <div className={`drawer-overlay ${isDrawerOpen ? 'visible' : ''}`} id="drawerOverlay" aria-hidden={!isDrawerOpen} onClick={toggleDrawer}></div>

      {/* Category chip bar */}
      <div className="chip-bar" id="shelves" role="navigation" aria-label="Browse by category">
        <div className="chip-scroll">
          {["All", "Reading now", "Quiet places", "Quotes", "Collections", "Notes", "Classics", "Weekend"].map((cat) => (
            <button key={cat} className={`chip ${activeCategory === cat.toLowerCase() ? "active" : ""}`} onClick={() => { setActiveCategory(cat.toLowerCase()); setVisibleCount(10); }}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Hero */}
      <section className="hero" id="top" aria-label="Welcome">
        <div className="hero-text">
          <p className="eyebrow">A private collection of slow things</p>
          <h1>Pages to keep,<br /><em>places to return&nbsp;to.</em></h1>
          <p className="hero-sub">A small shelf of books, thoughts, and gentle visual notes for unhurried days.</p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={() => scrollTo('collection')}>Explore collection</button>
            <button className="btn btn-ghost" onClick={() => scrollTo('shelves')}>View shelves</button>
          </div>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="hero-card hero-card-1">
            <img src="https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=500" alt="Books on a shelf" loading="eager" />
          </div>
          <div className="hero-card hero-card-2">
            <img src="https://images.pexels.com/photos/762687/pexels-photo-762687.jpeg?auto=compress&cs=tinysrgb&w=500" alt="Open book with coffee" loading="eager" />
          </div>
          <div className="hero-card hero-card-3">
            <img src="https://images.pexels.com/photos/1029141/pexels-photo-1029141.jpeg?auto=compress&cs=tinysrgb&w=300" alt="Reading nook" loading="eager" />
          </div>
        </div>
      </section>

      {/* Pinterest masonry pin grid */}
      <section className="pins-section" id="collection" aria-label="Books and inspiration">
        <div className="pins-grid" id="pinsGrid" role="list" aria-label="Pin collection">
          {displayedPins.map((pin) => (
            <div key={pin.id} className="pin-card">
              <div className="pin-img-wrap">
                <img src={pin.src} alt={pin.alt} />
              </div>
            </div>
          ))}
        </div>

        {/* Load more */}
        {hasMore && (
          <div className="load-more-wrap">
            <button className="btn-load-more" id="loadMoreBtn" aria-label="Load more pins" onClick={() => setVisibleCount(prev => prev + 10)}>
              <span>Load more</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12l7 7 7-7"/>
              </svg>
            </button>
          </div>
        )}
      </section>

      {/* Shelf note / second quiet door */}
      <section className="shelf-note" id="notes" aria-label="Library footer note">
        <p className="shelf-text">Saved slowly, read often, shared quietly.</p>
        <div className="shelf-divider" aria-hidden="true"></div>
        <button className="shelf-door" id="quietDoor2" aria-label="Open private room" onClick={() => window.location.href = '/gate'}>
          <span aria-hidden="true">✦</span>
        </button>
      </section>

      {/* Footer */}
      <footer className="site-footer" role="contentinfo">
        <p className="footer-brand">little library<span>.</span></p>
        <p className="footer-copy">A personal collection for two.</p>
      </footer>
    </>
  );
}

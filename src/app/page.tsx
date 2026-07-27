"use client";

import { useEffect, useState } from "react";
import Head from "next/head";

export default function Home() {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");

  const toggleDrawer = () => setDrawerOpen(!isDrawerOpen);

  return (
    <>
      {/* Top bar */}
      <header className="topbar" role="banner">
        <div className="topbar-left">
          <button className="hamburger" id="mobileMenu" aria-label="Open navigation" aria-expanded={isDrawerOpen} onClick={toggleDrawer}>
            <span></span><span></span><span></span>
          </button>
          <a className="brand" href="#top" aria-label="Little Library home">
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
            <a href="#shelves" className="nav-link active">Browse</a>
            <a href="#collection" className="nav-link">Collections</a>
            <a href="#notes" className="nav-link">Notes</a>
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
          <a href="#shelves">Browse</a>
          <a href="#collection">Collections</a>
          <a href="#notes">Notes</a>
        </nav>
      </div>
      <div className={`drawer-overlay ${isDrawerOpen ? 'visible' : ''}`} id="drawerOverlay" aria-hidden={!isDrawerOpen} onClick={toggleDrawer}></div>

      {/* Category chip bar */}
      <div className="chip-bar" id="shelves" role="navigation" aria-label="Browse by category">
        <div className="chip-scroll">
          {["All", "Reading now", "Quiet places", "Quotes", "Collections", "Notes", "Classics", "Weekend"].map((cat) => (
            <button key={cat} className={`chip ${activeCategory === cat.toLowerCase() ? "active" : ""}`} onClick={() => setActiveCategory(cat.toLowerCase())}>
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
            <button className="btn btn-primary">Explore collection</button>
            <button className="btn btn-ghost">View shelves</button>
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
          <div className="skeleton-pin" style={{height:"300px"}}></div>
          <div className="skeleton-pin" style={{height:"220px"}}></div>
          <div className="skeleton-pin" style={{height:"360px"}}></div>
          <div className="skeleton-pin" style={{height:"250px"}}></div>
          <div className="skeleton-pin" style={{height:"290px"}}></div>
          <div className="skeleton-pin" style={{height:"400px"}}></div>
          <div className="skeleton-pin" style={{height:"260px"}}></div>
          <div className="skeleton-pin" style={{height:"330px"}}></div>
          <div className="skeleton-pin" style={{height:"210px"}}></div>
          <div className="skeleton-pin" style={{height:"280px"}}></div>
        </div>

        {/* Load more */}
        <div className="load-more-wrap">
          <button className="btn-load-more" id="loadMoreBtn" aria-label="Load more pins">
            <span>Load more</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12l7 7 7-7"/>
            </svg>
          </button>
        </div>
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

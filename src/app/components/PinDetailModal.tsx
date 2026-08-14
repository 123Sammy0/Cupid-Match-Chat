"use client";

import React, { useEffect, useState } from "react";

export interface PinItem {
  id: string | number;
  title?: string;
  description?: string;
  alt?: string;
  src?: {
    original?: string;
    large2x?: string;
    large?: string;
    medium?: string;
    small?: string;
  };
  url?: string;
  width?: number;
  height?: number;
  provider?: string;
  photographer?: string;
  photographer_url?: string;
  photographer_avatar?: string;
  tags?: string[];
  likes?: number;
  views?: number;
  avg_color?: string;
}

interface PinDetailModalProps {
  pin: PinItem | null;
  isOpen: boolean;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  isSaved: boolean;
  onToggleSave: (pin: PinItem) => void;
  onTagClick?: (tag: string) => void;
  onShowToast: (msg: string) => void;
}

export function PinDetailModal({
  pin,
  isOpen,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  isSaved,
  onToggleSave,
  onTagClick,
  onShowToast
}: PinDetailModalProps) {
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<Array<{ id: string; text: string; date: string }>>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  // Load comments from localStorage for this pin
  useEffect(() => {
    if (pin?.id) {
      const stored = localStorage.getItem(`pin_comments_${pin.id}`);
      if (stored) {
        try {
          setComments(JSON.parse(stored));
        } catch {
          setComments([]);
        }
      } else {
        setComments([]);
      }
    }
  }, [pin?.id]);

  // Keyboard navigation & lock scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && onPrev && hasPrev) onPrev();
      if (e.key === "ArrowRight" && onNext && hasNext) onNext();
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, onPrev, onNext, hasPrev, hasNext]);

  if (!isOpen || !pin) return null;

  const imgSrc = pin.src?.large2x || pin.src?.large || pin.src?.medium || (pin as any).src;
  const pinTitle = pin.title || pin.alt || "Aesthetic Collection";
  const pinDesc = pin.description || pin.alt || "Curated aesthetic visual note for your collection.";
  const creatorName = pin.photographer || "Curated Creator";
  const creatorUrl = pin.photographer_url || pin.url || "#";
  const creatorAvatar = pin.photographer_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(creatorName)}&backgroundColor=e8d98a,c48a6e,4f8b6e`;
  const domainName = pin.provider === "pixabay" ? "pixabay.com" : pin.provider === "pexels" ? "pexels.com" : "library.art";

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const newComment = {
      id: Date.now().toString(),
      text: commentText.trim(),
      date: "Just now"
    };

    const updated = [...comments, newComment];
    setComments(updated);
    if (pin.id) {
      localStorage.setItem(`pin_comments_${pin.id}`, JSON.stringify(updated));
    }
    setCommentText("");
    onShowToast("Note added to pin!");
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: pinTitle,
          text: pinDesc,
          url: shareUrl
        });
      } catch (err) {
        // User cancelled or fallback
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      onShowToast("Link copied to clipboard!");
    }
  };

  const handleCopyImageLink = () => {
    if (imgSrc) {
      navigator.clipboard.writeText(imgSrc);
      onShowToast("Image link copied!");
      setIsMenuOpen(false);
    }
  };

  const handleDownload = () => {
    if (imgSrc) {
      const a = document.createElement("a");
      a.href = imgSrc;
      a.download = `pin-${pin.id}.jpg`;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      onShowToast("Opening download...");
      setIsMenuOpen(false);
    }
  };

  return (
    <div 
      className="pin-modal-backdrop" 
      onClick={onClose} 
      role="dialog" 
      aria-modal="true"
      aria-label={pinTitle}
    >
      {/* Floating navigation buttons */}
      {hasPrev && onPrev && (
        <button 
          className="pin-nav-btn pin-nav-prev" 
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          aria-label="Previous pin (Left Arrow)"
          title="Previous (Left Arrow)"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>
      )}

      {hasNext && onNext && (
        <button 
          className="pin-nav-btn pin-nav-next" 
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          aria-label="Next pin (Right Arrow)"
          title="Next (Right Arrow)"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6"/>
          </svg>
        </button>
      )}

      {/* Floating Close Button Top-Right */}
      <button 
        className="pin-modal-close-floating" 
        onClick={onClose} 
        aria-label="Close dialog"
        title="Close (Esc)"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Main Pinterest Modal Box */}
      <div 
        className="pin-modal-card" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Column: Full-Scale Image Preview */}
        <div className="pin-modal-image-col">
          <div className="pin-modal-image-wrapper">
            <img 
              src={imgSrc} 
              alt={pinTitle} 
              className="pin-modal-img"
              loading="eager"
            />
            
            {/* Direct view link button overlay */}
            <div className="pin-modal-img-overlay">
              <a 
                href={pin.url || imgSrc} 
                target="_blank" 
                rel="noopener noreferrer"
                className="pin-modal-source-btn"
              >
                <span>{domainName}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M7 17L17 7M17 7H7M17 7V17"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Right Column: Pinterest Details, Description, Creator, and Comments */}
        <div className="pin-modal-content-col">
          {/* Top Bar Actions */}
          <div className="pin-modal-header">
            <div className="pin-modal-header-actions">
              {/* Share */}
              <button 
                className="pin-action-icon-btn" 
                onClick={handleShare} 
                title="Share pin" 
                aria-label="Share"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
              </button>

              {/* Like / Heart */}
              <button 
                className={`pin-action-icon-btn ${isLiked ? 'liked text-[#E60023]' : ''}`} 
                onClick={() => {
                  setIsLiked(!isLiked);
                  onShowToast(!isLiked ? "Added to your likes" : "Removed like");
                }} 
                title="React" 
                aria-label="React"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>

              {/* Options Menu */}
              <div className="relative">
                <button 
                  className="pin-action-icon-btn" 
                  onClick={() => setIsMenuOpen(!isMenuOpen)} 
                  title="More options" 
                  aria-label="More options"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/><circle cx="5" cy="12" r="2"/>
                  </svg>
                </button>

                {isMenuOpen && (
                  <div className="pin-dropdown-menu">
                    <button onClick={handleDownload} className="pin-dropdown-item">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      Download image
                    </button>
                    <button onClick={handleCopyImageLink} className="pin-dropdown-item">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                      </svg>
                      Copy image address
                    </button>
                    <a 
                      href={pin.url || imgSrc} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="pin-dropdown-item"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                        <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                      </svg>
                      Open source link
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Red Pinterest Save / Saved Button */}
            <button 
              className={`pin-save-btn ${isSaved ? "saved" : ""}`}
              onClick={() => onToggleSave(pin)}
            >
              {isSaved ? "Saved" : "Save"}
            </button>
          </div>

          {/* Body Content */}
          <div className="pin-modal-body-scroll">
            {/* Source destination */}
            <div className="pin-modal-source-row">
              <a 
                href={pin.url || "#"} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="pin-source-link"
              >
                {domainName}
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M7 17L17 7M17 7H7M17 7V17"/>
                </svg>
              </a>
            </div>

            {/* Title */}
            <h1 className="pin-modal-title">{pinTitle}</h1>

            {/* Description */}
            <p className="pin-modal-description">{pinDesc}</p>

            {/* Creator Row */}
            <div className="pin-modal-creator-row">
              <div className="pin-creator-left">
                <img 
                  src={creatorAvatar} 
                  alt={creatorName} 
                  className="pin-creator-avatar" 
                />
                <div className="pin-creator-info">
                  <span className="pin-creator-name">{creatorName}</span>
                  <span className="pin-creator-sub">Featured artist on {domainName}</span>
                </div>
              </div>

              <a 
                href={creatorUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="pin-creator-visit-btn"
              >
                Visit
              </a>
            </div>

            {/* Tags section */}
            {pin.tags && pin.tags.length > 0 && (
              <div className="pin-modal-tags-wrap">
                <span className="pin-tags-label">Related themes:</span>
                <div className="pin-modal-tags">
                  {pin.tags.map((tag, idx) => (
                    <button 
                      key={idx} 
                      className="pin-tag-chip"
                      onClick={() => {
                        if (onTagClick) {
                          onTagClick(tag);
                          onClose();
                        }
                      }}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Notes / Comments Section */}
            <div className="pin-modal-comments-section">
              <div className="pin-comments-header">
                <h3>Notes & Thoughts</h3>
                <span className="pin-comments-count">{comments.length}</span>
              </div>

              {comments.length === 0 ? (
                <p className="pin-comments-empty">
                  No notes yet. Add your personal reflections or quotes for this pin.
                </p>
              ) : (
                <div className="pin-comments-list">
                  {comments.map((c) => (
                    <div key={c.id} className="pin-comment-item">
                      <div className="pin-comment-avatar">✦</div>
                      <div className="pin-comment-content">
                        <p className="pin-comment-text">{c.text}</p>
                        <span className="pin-comment-time">{c.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Note Form */}
              <form onSubmit={handleAddComment} className="pin-comment-form">
                <input 
                  type="text" 
                  placeholder="Add a note or thought about this page…" 
                  value={commentText} 
                  onChange={(e) => setCommentText(e.target.value)}
                  className="pin-comment-input"
                />
                {commentText.trim() && (
                  <button type="submit" className="pin-comment-submit-btn">
                    Done
                  </button>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

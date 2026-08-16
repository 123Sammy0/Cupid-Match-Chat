"use client";

import { GiphyFetch } from '@giphy/js-fetch-api';
import { Grid } from '@giphy/react-components';
import { useState, useRef, useEffect, useCallback } from 'react';

const gf = new GiphyFetch(process.env.NEXT_PUBLIC_GIPHY_API_KEY || '');

interface GifPickerProps {
  onSelect: (gif: any, type: 'gif' | 'sticker') => void;
  onClose: () => void;
}

export default function GifPicker({ onSelect, onClose }: GifPickerProps) {
  const [tab, setTab] = useState<'gifs' | 'stickers'>('gifs');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  // Measure width after mount (and on resize)
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        setWidth(containerRef.current.offsetWidth - 16);
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Memoize fetchGifs — Grid component re-fetches when this reference changes
  const fetchGifs = useCallback(
    (offset: number) => {
      const type = tab === 'gifs' ? 'gifs' : 'stickers';
      if (debouncedSearch) {
        return gf.search(debouncedSearch, { offset, limit: 18, type }).catch(() => gf.search(debouncedSearch, { offset, limit: 18, type: 'gifs' }));
      }
      return gf.trending({ offset, limit: 18, type }).catch(() => gf.search(tab === 'stickers' ? 'sticker' : 'trending', { offset, limit: 18, type: 'gifs' }));
    },
    [tab, debouncedSearch]
  );

  return (
    <div
      className="flex flex-col w-full bg-white select-none"
      style={{ height: 320 }}
      ref={containerRef}
    >
      {/* Header row: tabs + close */}
      <div className="flex items-center border-b border-gray-100 px-2 flex-shrink-0">
        <button
          onClick={() => { setTab('gifs'); setSearchTerm(''); setDebouncedSearch(''); }}
          className={`flex-1 px-3 py-2.5 text-sm font-semibold transition-all border-b-2 -mb-px ${
            tab === 'gifs' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          GIFs
        </button>
        <button
          onClick={() => { setTab('stickers'); setSearchTerm(''); setDebouncedSearch(''); }}
          className={`flex-1 px-3 py-2.5 text-sm font-semibold transition-all border-b-2 -mb-px ${
            tab === 'stickers' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Stickers
        </button>
        <button
          onClick={onClose}
          className="ml-1 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-black transition-colors flex-shrink-0"
          aria-label="Close GIF picker"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      {/* Search bar */}
      <div className="px-2 py-1.5 flex-shrink-0">
        <div className="relative">
          <input
            type="text"
            placeholder={`Search ${tab}…`}
            className="w-full bg-slate-100 text-sm p-2 pl-8 rounded-[12px] outline-none border border-transparent focus:border-slate-300 transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
        </div>
      </div>

      {/* GIF Grid — only render when we know the real width */}
      <div className="flex-1 overflow-y-auto px-1">
        {width > 0 && (
          <Grid
            key={`${tab}-${debouncedSearch}`}
            width={width}
            columns={3}
            gutter={4}
            fetchGifs={fetchGifs}
            noLink={true}
            onGifClick={(gif, e) => {
              e.preventDefault();
              onSelect(gif, tab === 'gifs' ? 'gif' : 'sticker');
            }}
          />
        )}
      </div>
    </div>
  );
}


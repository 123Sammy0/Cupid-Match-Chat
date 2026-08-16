"use client";

import { GiphyFetch } from '@giphy/js-fetch-api';
import { Grid } from '@giphy/react-components';
import { useState, useRef, useEffect } from 'react';

const gf = new GiphyFetch(process.env.NEXT_PUBLIC_GIPHY_API_KEY || '');

export default function GifPicker({ onSelect }: { onSelect: (gif: any, type: 'gif' | 'sticker') => void }) {
  const [tab, setTab] = useState<'gifs' | 'stickers'>('gifs');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(300);

  useEffect(() => {
    if (containerRef.current) {
      setWidth(containerRef.current.offsetWidth - 16); // padding adjustment
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchGifs = (offset: number) => {
    if (debouncedSearch) {
      return gf.search(debouncedSearch, { offset, limit: 15, type: tab === 'gifs' ? 'gifs' : 'stickers' });
    }
    return gf.trending({ offset, limit: 15, type: tab === 'gifs' ? 'gifs' : 'stickers' });
  };

  return (
    <div className="flex flex-col w-full h-[320px] bg-white border-t border-[#EEE7F7]" ref={containerRef}>
      <div className="flex items-center gap-0 border-b border-gray-100 px-2">
        <button
          onClick={() => { setTab('gifs'); setSearchTerm(''); }}
          className={`flex-1 px-3 py-2.5 text-sm font-semibold transition-all border-b-2 ${tab === 'gifs' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          GIFs
        </button>
        <button
          onClick={() => { setTab('stickers'); setSearchTerm(''); }}
          className={`flex-1 px-3 py-2.5 text-sm font-semibold transition-all border-b-2 ${tab === 'stickers' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          Stickers
        </button>
      </div>
      <div className="p-2 border-b border-gray-100">
        <div className="relative">
          <input
            type="text"
            placeholder={`Search ${tab}...`}
            className="w-full bg-slate-100 text-sm p-2 pl-8 rounded-[12px] outline-none border border-transparent focus:border-slate-300 transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <Grid
          key={`${tab}-${debouncedSearch}`}
          width={width}
          columns={3}
          gutter={6}
          fetchGifs={fetchGifs}
          noLink={true}
          onGifClick={(gif, e) => {
            e.preventDefault();
            onSelect(gif, tab === 'gifs' ? 'gif' : 'sticker');
          }}
        />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   LITTLE LIBRARY — Pinterest Pin App
   Pexels API + Real-time pin rendering
   Prototype only: auth uses localStorage
══════════════════════════════════════════════ */

'use strict';

// ── Pexels API ──────────────────────────────
const PEXELS_KEY = 't9MvcH2o3WfzNsbAhC2a7HQfxktUjn55zPfRU0oo1h5ngRkSjC8nLweG';
const PEXELS_BASE = 'https://api.pexels.com/v1';

// ── State ────────────────────────────────────
const state = {
  mode: 'login',
  user: JSON.parse(sessionStorage.getItem('ll_active_user') || 'null'),
  room: null,
  savedPins: JSON.parse(localStorage.getItem('ll_saved_pins') || '[]'),
  currentPage: 1,
  currentCat: 'all',
  allPins: [],        // mixed: pexels images + static quote/book cards
  loading: false,
};

// ── Selectors ────────────────────────────────
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

const libraryView = $('#libraryView');
const authView    = $('#authView');
const roomView    = $('#roomView');
const chatView    = $('#chatView');
const pinsGrid    = $('#pinsGrid');
const pinsLoading = $('#pinsLoading');

// ── Utility: show a view ─────────────────────
function showView(view) {
  [libraryView, authView, roomView, chatView].forEach(v => {
    v.classList.add('hidden');
  });
  view.classList.remove('hidden');
  if (view === libraryView) {
    document.body.style.overflow = '';
  } else {
    document.body.style.overflow = 'hidden';
  }
}

// ── Utility: toast ───────────────────────────
let toastTimer;
function showToast(msg, duration = 3000) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), duration);
}

// ── Utility: escape HTML ─────────────────────
function esc(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ── Utility: format time ─────────────────────
function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ── Local "DB" helpers (prototype) ───────────
const getUsers     = () => JSON.parse(localStorage.getItem('ll_users') || '[]');
const saveUsers    = list => localStorage.setItem('ll_users', JSON.stringify(list));
const msgKey       = code => `ll_msgs_${code.toLowerCase().trim()}`;
const getMessages  = code => JSON.parse(localStorage.getItem(msgKey(code)) || '[]');
const saveMessages = (code, list) => localStorage.setItem(msgKey(code), JSON.stringify(list));

/* ═══════════════════════════════════════════════
   PEXELS API — Fetch images
═══════════════════════════════════════════════ */

const SEARCH_QUERIES = {
  all:         'books reading cozy library',
  reading:     'books open reading',
  nature:      'nature landscape calm forest',
  quotes:      'minimal desk notebook',
  collections: 'vintage books shelf library',
  notes:       'coffee notebook writing journal',
  classics:    'old books antique library',
  weekend:     'nature outdoor peaceful travel',
};

async function fetchPexels(query, page = 1, perPage = 20) {
  try {
    const res = await fetch(
      `${PEXELS_BASE}/search?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}`,
      { headers: { Authorization: PEXELS_KEY } }
    );
    if (!res.ok) throw new Error(`Pexels ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Pexels fetch failed:', err.message);
    return null;
  }
}

/* ═══════════════════════════════════════════════
   STATIC CARDS — Quote & Book tiles
═══════════════════════════════════════════════ */

const QUOTE_CARDS = [
  {
    type: 'quote',
    theme: 'moss',
    quote: 'There is time enough for the things that make you feel alive.',
    label: 'Field note 04',
    tags: ['quotes', 'all'],
  },
  {
    type: 'quote',
    theme: 'sky',
    quote: 'Make room for a softer life.',
    label: 'Sunday note',
    tags: ['quotes', 'all', 'weekend'],
  },
  {
    type: 'quote',
    theme: 'plum',
    quote: 'Read slowly. You are not in a hurry.',
    label: 'Margin note',
    tags: ['quotes', 'reading', 'all'],
  },
  {
    type: 'quote',
    theme: 'paper',
    quote: 'A book is a dream you hold in your hands.',
    label: 'Reading log',
    tags: ['quotes', 'reading', 'classics', 'all'],
  },
  {
    type: 'quote',
    theme: 'rose',
    quote: 'Quiet mornings are their own kind of magic.',
    label: 'Morning pages',
    tags: ['quotes', 'notes', 'all'],
  },
  {
    type: 'quote',
    theme: 'ink',
    quote: 'Nature\u00a0=\u00a0Future.',
    label: 'A short collection',
    tags: ['nature', 'all'],
  },
  {
    type: 'quote',
    theme: 'lavender',
    quote: 'Let the world be large and yourself small within it.',
    label: 'Field note 11',
    tags: ['quotes', 'nature', 'all'],
  },
  {
    type: 'quote',
    theme: 'amber',
    quote: 'Go slowly. This is not a race.',
    label: 'Weekend note',
    tags: ['quotes', 'weekend', 'all'],
  },
  {
    type: 'quote',
    theme: 'earth',
    quote: 'Every book is a new world waiting to be entered.',
    label: 'Earth tones',
    tags: ['reading', 'classics', 'all'],
  },
  {
    type: 'quote',
    theme: 'sand',
    quote: 'The best moments are the ones you barely remember.',
    label: 'Sand & warmth',
    tags: ['notes', 'weekend', 'all'],
  },
  {
    type: 'quote',
    theme: 'peach',
    quote: 'Collect moments, not things.',
    label: 'Warm tones',
    tags: ['quotes', 'collections', 'all'],
  },
  {
    type: 'quote',
    theme: 'midnight',
    quote: 'Some of the best conversations happen in the dark.',
    label: 'Midnight blue',
    tags: ['quotes', 'notes', 'all'],
  },
];

const BOOK_CARDS = [
  {
    type: 'book',
    theme: 'paper',
    label: 'little library edition',
    title: 'Articles worth reading in your <i>twenties.</i>',
    tag: 'Essays & notes',
    tags: ['reading', 'collections', 'all'],
  },
  {
    type: 'book',
    theme: 'earth',
    label: 'quiet classics',
    title: 'Books that changed <em style="font-style:italic">everything.</em>',
    tag: 'A curated shelf',
    tags: ['classics', 'collections', 'all'],
  },
  {
    type: 'book',
    theme: 'ink',
    label: 'saved for later',
    title: 'Long reads for slow weekends.',
    tag: 'Weekend list',
    tags: ['weekend', 'collections', 'all'],
  },
  {
    type: 'book',
    theme: 'midnight',
    label: 'morning shelf',
    title: 'What to read with your first cup.',
    tag: 'Morning notes',
    tags: ['notes', 'reading', 'all'],
  },
  {
    type: 'book',
    theme: 'moss',
    label: 'nature & science',
    title: 'Books that make you love the natural world.',
    tag: 'Nature reads',
    tags: ['nature', 'collections', 'all'],
  },
  {
    type: 'book',
    theme: 'sand',
    label: 'weekend reading',
    title: 'Short stories for long afternoons.',
    tag: 'Short fiction',
    tags: ['weekend', 'reading', 'all'],
  },
];

/* ═══════════════════════════════════════════════
   PIN RENDERING — Pinterest layout
═══════════════════════════════════════════════ */

function buildImagePin(photo, isSaved) {
  const saved = isSaved || state.savedPins.includes(String(photo.id));
  const imgSrc = photo.src.medium || photo.src.large;
  const imgLarge = photo.src.large || photo.src.original;
  const alt = esc(photo.alt || 'Book and reading inspiration');
  const author = esc(photo.photographer || 'Pexels');
  const initials = author.slice(0, 2).toUpperCase();

  const pin = document.createElement('article');
  pin.className = 'pin-card';
  pin.setAttribute('role', 'listitem');
  pin.setAttribute('tabindex', '0');
  pin.setAttribute('aria-label', alt);
  pin.dataset.pinId = photo.id;
  pin.dataset.pinType = 'image';

  pin.innerHTML = `
    <div class="pin-img-wrap">
      <img
        src="${imgSrc}"
        alt="${alt}"
        loading="lazy"
        decoding="async"
        style="aspect-ratio: ${photo.width}/${photo.height}"
      />
      <div class="pin-hover-overlay" aria-hidden="true">
        <button class="pin-save-btn ${saved ? 'saved' : ''}" data-pin-id="${photo.id}" aria-label="${saved ? 'Saved' : 'Save pin'}">
          ${saved ? '✦ Saved' : 'Save'}
        </button>
        <button class="pin-more-btn" aria-label="More options">•••</button>
      </div>
    </div>
    <div class="pin-meta">
      <p class="pin-title">${alt}</p>
      <div class="pin-author">
        <div class="pin-avatar">${initials}</div>
        <p class="pin-author-name">${author}</p>
      </div>
    </div>`;

  // Click → open overlay
  pin.addEventListener('click', e => {
    if (e.target.closest('.pin-save-btn')) { e.stopPropagation(); toggleSave(photo.id, pin, photo); return; }
    if (e.target.closest('.pin-more-btn')) { e.stopPropagation(); return; }
    openPinOverlay({
      img: imgLarge,
      alt: photo.alt || 'Reading inspiration',
      title: photo.alt || 'Reading inspiration',
      note: `Photo by ${photo.photographer} on Pexels`,
      author: photo.photographer,
      authorInitials: initials,
      tags: inferTags(photo.alt || ''),
      pinId: photo.id,
    });
  });
  pin.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pin.click(); } });

  return pin;
}

function buildQuotePin(card) {
  const pin = document.createElement('article');
  pin.className = `pin-quote pin-quote-${card.theme}`;
  pin.setAttribute('role', 'listitem');
  pin.setAttribute('tabindex', '0');
  pin.setAttribute('aria-label', card.quote);
  pin.dataset.pinType = 'quote';

  pin.innerHTML = `
    <div class="pin-quote-mark" aria-hidden="true">"</div>
    <p class="pin-quote-text">${esc(card.quote)}</p>
    <span class="pin-quote-label">${esc(card.label)}</span>`;

  pin.addEventListener('click', () => {
    openPinOverlay({
      img: null,
      alt: card.quote,
      title: card.quote,
      note: card.label,
      tags: card.tags.filter(t => t !== 'all'),
      isQuote: true,
      quoteTheme: card.theme,
    });
  });
  pin.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pin.click(); } });

  return pin;
}

function buildBookPin(card) {
  const pin = document.createElement('article');
  pin.className = `pin-book pin-quote-${card.theme}`;
  pin.setAttribute('role', 'listitem');
  pin.setAttribute('tabindex', '0');
  pin.setAttribute('aria-label', card.label + ' — ' + card.tag);
  pin.dataset.pinType = 'book';

  pin.innerHTML = `
    <p class="pin-book-label">${esc(card.label)}</p>
    <h2 class="pin-book-title">${card.title}</h2>
    <p class="pin-book-tag">${esc(card.tag)}</p>`;

  pin.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pin.click(); } });
  return pin;
}

function inferTags(text) {
  const t = text.toLowerCase();
  const tags = [];
  if (t.includes('book') || t.includes('read')) tags.push('reading');
  if (t.includes('nature') || t.includes('forest') || t.includes('mountain')) tags.push('nature');
  if (t.includes('cozy') || t.includes('cafe') || t.includes('coffee')) tags.push('notes');
  if (tags.length === 0) tags.push('collections');
  return tags;
}

/* Shuffle-merge Pexels photos with quote/book cards */
function interleaveCards(photos, quoteCards, bookCards) {
  const items = [];
  const quoteCopy = [...quoteCards];
  const bookCopy  = [...bookCards];

  photos.forEach((photo, i) => {
    items.push({ kind: 'image', data: photo });
    // Insert a quote every 4 images
    if ((i + 1) % 4 === 0 && quoteCopy.length) {
      items.push({ kind: 'quote', data: quoteCopy.shift() });
    }
    // Insert a book every 7 images
    if ((i + 1) % 7 === 0 && bookCopy.length) {
      items.push({ kind: 'book', data: bookCopy.shift() });
    }
  });

  // Append remaining quotes + books
  quoteCopy.forEach(q => items.push({ kind: 'quote', data: q }));
  bookCopy.forEach(b => items.push({ kind: 'book', data: b }));

  return items;
}

/* Render pins into grid */
function renderPins(items, append = false) {
  if (!append) {
    pinsGrid.innerHTML = '';
    pinsGrid.removeAttribute('aria-busy');
  }

  const fragment = document.createDocumentFragment();

  items.forEach(item => {
    let el;
    if (item.kind === 'image')  el = buildImagePin(item.data);
    if (item.kind === 'quote')  el = buildQuotePin(item.data);
    if (item.kind === 'book')   el = buildBookPin(item.data);
    if (el) fragment.appendChild(el);
  });

  pinsGrid.appendChild(fragment);
}

/* Load pins for a category */
async function loadPins(cat = 'all', page = 1, append = false) {
  if (state.loading) return;
  state.loading = true;

  if (!append) {
    pinsGrid.setAttribute('aria-busy', 'true');
    pinsGrid.innerHTML = '';
    // Show skeleton
    const skeletons = Array.from({ length: 8 }, () => {
      const sk = document.createElement('div');
      sk.className = 'skeleton-pin';
      const h = 220 + Math.random() * 200;
      sk.style.height = h + 'px';
      sk.style.marginBottom = '12px';
      sk.style.breakInside = 'avoid';
      return sk;
    });
    skeletons.forEach(s => pinsGrid.appendChild(s));
  }

  const query = SEARCH_QUERIES[cat] || SEARCH_QUERIES.all;
  const data = await fetchPexels(query, page, 20);

  // Filter static cards by category
  const relevantQuotes = cat === 'all'
    ? QUOTE_CARDS
    : QUOTE_CARDS.filter(q => q.tags.includes(cat));
  const relevantBooks  = cat === 'all'
    ? BOOK_CARDS
    : BOOK_CARDS.filter(b => b.tags.includes(cat));

  let photos = [];
  if (data && data.photos) photos = data.photos;

  // Fallback photos if API fails
  if (photos.length === 0) {
    photos = FALLBACK_PHOTOS;
  }

  const items = append
    ? photos.map(p => ({ kind: 'image', data: p }))
    : interleaveCards(photos, relevantQuotes, relevantBooks);

  // Remove skeletons
  if (!append) {
    $$('.skeleton-pin', pinsGrid).forEach(s => s.remove());
    pinsGrid.removeAttribute('aria-busy');
  }

  renderPins(items, append);
  state.loading = false;
}

/* ── Fallback photos if API is unavailable ── */
const FALLBACK_PHOTOS = [
  { id: 'f1', width: 4, height: 5, alt: 'Books on a wooden shelf', photographer: 'Library', src: { medium: 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=400', large: 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=800' } },
  { id: 'f2', width: 3, height: 4, alt: 'Open book with coffee', photographer: 'Reader', src: { medium: 'https://images.pexels.com/photos/762687/pexels-photo-762687.jpeg?auto=compress&cs=tinysrgb&w=400', large: 'https://images.pexels.com/photos/762687/pexels-photo-762687.jpeg?auto=compress&cs=tinysrgb&w=800' } },
  { id: 'f3', width: 4, height: 3, alt: 'Misty green hills', photographer: 'Nature', src: { medium: 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=400', large: 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=800' } },
  { id: 'f4', width: 3, height: 5, alt: 'Cozy reading corner', photographer: 'Interior', src: { medium: 'https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=400', large: 'https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=800' } },
  { id: 'f5', width: 4, height: 4, alt: 'Mountain landscape', photographer: 'Travel', src: { medium: 'https://images.pexels.com/photos/1519681393784/pexels-photo.jpeg?auto=compress&cs=tinysrgb&w=400', large: 'https://images.pexels.com/photos/1519681393784/pexels-photo.jpeg?auto=compress&cs=tinysrgb&w=800' } },
  { id: 'f6', width: 3, height: 4, alt: 'Stack of books nightstand', photographer: 'Books', src: { medium: 'https://images.pexels.com/photos/495446815901/pexels-photo.jpeg?auto=compress&cs=tinysrgb&w=400', large: 'https://images.pexels.com/photos/495446815901/pexels-photo.jpeg?auto=compress&cs=tinysrgb&w=800' } },
];

/* ═══════════════════════════════════════════════
   PIN OVERLAY
═══════════════════════════════════════════════ */

function openPinOverlay({ img, alt, title, note, author, authorInitials, tags, pinId, isQuote, quoteTheme }) {
  const overlay    = $('#pinOverlay');
  const backdrop   = $('#overlayBackdrop');
  const imgEl      = $('#pinOverlayImg');
  const titleEl    = $('#pinDetailTitle');
  const noteEl     = $('#pinOverlayNote');
  const tagsEl     = $('#pinOverlayTags');
  const authorName = $('#pinAuthorName');
  const authorAv   = $('#pinAuthorAvatar');
  const saveBtn    = $('#pinActionSave');

  if (img) {
    imgEl.src = img;
    imgEl.alt = alt || '';
    imgEl.style.display = '';
  } else {
    imgEl.style.display = 'none';
  }

  titleEl.textContent = title || '';
  noteEl.textContent  = note  || '';
  authorName.textContent = author || 'Little Library';
  authorAv.textContent   = (authorInitials || 'LL').toUpperCase();

  tagsEl.innerHTML = (tags || []).map(t =>
    `<span class="pin-tag">${esc(t)}</span>`
  ).join('');

  const saved = pinId && state.savedPins.includes(String(pinId));
  saveBtn.className = 'pin-action-save' + (saved ? ' saved' : '');
  saveBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="${saved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
    ${saved ? 'Saved' : 'Save'}`;
  saveBtn.onclick = () => {
    if (pinId) toggleSaveById(String(pinId), saveBtn);
  };

  overlay.classList.remove('hidden');
  backdrop.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  overlay.focus();

  // Trap focus
  const focusable = [...$$('button, a, input, [tabindex]', overlay)].filter(el => !el.closest('.hidden'));
  if (focusable[0]) focusable[0].focus();
}

function closePinOverlay() {
  $('#pinOverlay').classList.add('hidden');
  $('#overlayBackdrop').classList.add('hidden');
  if (!$('#authView:not(.hidden)') && !$('#roomView:not(.hidden)') && !$('#chatView:not(.hidden)')) {
    document.body.style.overflow = '';
  }
}

$('#pinOverlayClose').addEventListener('click', closePinOverlay);
$('#overlayBackdrop').addEventListener('click', closePinOverlay);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closePinOverlay();
});

/* ─ Save / unsave ─ */
function toggleSave(pinId, pinEl, photo) {
  const id = String(pinId);
  const idx = state.savedPins.indexOf(id);
  if (idx === -1) {
    state.savedPins.push(id);
    showToast('Saved to your library ✦');
  } else {
    state.savedPins.splice(idx, 1);
    showToast('Removed from library');
  }
  localStorage.setItem('ll_saved_pins', JSON.stringify(state.savedPins));

  // Update all save buttons for this pin
  $$(`[data-pin-id="${id}"]`).forEach(btn => {
    const saved = state.savedPins.includes(id);
    btn.textContent = saved ? '✦ Saved' : 'Save';
    btn.classList.toggle('saved', saved);
    btn.setAttribute('aria-label', saved ? 'Saved' : 'Save pin');
  });
}

function toggleSaveById(id, btn) {
  const idx = state.savedPins.indexOf(id);
  const nowSaved = idx === -1;
  if (nowSaved) state.savedPins.push(id); else state.savedPins.splice(idx, 1);
  localStorage.setItem('ll_saved_pins', JSON.stringify(state.savedPins));

  btn.className = 'pin-action-save' + (nowSaved ? ' saved' : '');
  btn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="${nowSaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
    ${nowSaved ? 'Saved' : 'Save'}`;
  showToast(nowSaved ? 'Saved to your library ✦' : 'Removed from library');
}

/* ═══════════════════════════════════════════════
   CATEGORY CHIPS
═══════════════════════════════════════════════ */
$$('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    $$('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    state.currentCat = chip.dataset.cat;
    state.currentPage = 1;
    loadPins(state.currentCat, 1, false);
  });
});

/* ── Load more ── */
$('#loadMoreBtn').addEventListener('click', () => {
  state.currentPage++;
  loadPins(state.currentCat, state.currentPage, true);
});

/* ── Search ── */
let searchTimer;
$('#searchInput').addEventListener('input', e => {
  clearTimeout(searchTimer);
  const q = e.target.value.trim();
  if (!q) { loadPins(state.currentCat, 1, false); return; }
  searchTimer = setTimeout(async () => {
    state.loading = true;
    pinsGrid.innerHTML = '';
    const skels = Array.from({ length: 6 }, () => {
      const s = document.createElement('div');
      s.className = 'skeleton-pin';
      s.style.height = (220 + Math.random() * 180) + 'px';
      s.style.marginBottom = '12px';
      return s;
    });
    skels.forEach(s => pinsGrid.appendChild(s));

    const data = await fetchPexels(q + ' books library reading', 1, 20);
    $$('.skeleton-pin', pinsGrid).forEach(s => s.remove());

    if (data && data.photos && data.photos.length) {
      const items = data.photos.map(p => ({ kind: 'image', data: p }));
      renderPins(items, false);
    } else {
      pinsGrid.innerHTML = '<p style="text-align:center;color:var(--muted);font-size:14px;padding:40px;grid-column:1/-1">No results found for your search.</p>';
    }
    state.loading = false;
  }, 500);
});

/* ═══════════════════════════════════════════════
   MOBILE DRAWER
═══════════════════════════════════════════════ */
const drawer  = $('#mobileDrawer');
const overlay = $('#drawerOverlay');
const menuBtn = $('#mobileMenu');

function openDrawer() {
  drawer.setAttribute('aria-hidden', 'false');
  overlay.setAttribute('aria-hidden', 'false');
  menuBtn.setAttribute('aria-expanded', 'true');
}
function closeDrawer() {
  drawer.setAttribute('aria-hidden', 'true');
  overlay.setAttribute('aria-hidden', 'true');
  menuBtn.setAttribute('aria-expanded', 'false');
}
menuBtn.addEventListener('click', () => {
  drawer.getAttribute('aria-hidden') === 'false' ? closeDrawer() : openDrawer();
});
overlay.addEventListener('click', closeDrawer);
$$('.mobile-drawer nav a').forEach(a => a.addEventListener('click', closeDrawer));

/* ═══════════════════════════════════════════════
   AUTH FLOW
═══════════════════════════════════════════════ */

function openAuth(mode = 'login') {
  state.mode = mode;
  const isSignup = mode === 'signup';

  $('#authTitle').textContent    = isSignup ? 'Create your space' : 'Welcome back';
  $('#authSubtitle').textContent = isSignup
    ? 'Set up one of the two private accounts.'
    : 'Enter your details to open your room.';
  $('#authSubmit').textContent   = isSignup ? 'Create account' : 'Log in';
  $('#toggleAuth').textContent   = isSignup ? 'Already have an account? Log in' : 'New here? Create an account';
  $('#confirmField').hidden      = !isSignup;
  $('#authMessage').textContent  = '';
  $('#authForm').reset();

  showView(authView);
  setTimeout(() => $('#username').focus(), 60);
}

// ── Word lists for readable room codes ──────────────────────
const WORDS_A = ['amber','birch','cedar','dawn','echo','fern','grove','haven','iris','jade','kindle','lark','maple','nova','opal','pine','quiet','rose','sage','tide','vale','wren','xylem','yarrow','zeal'];
const WORDS_B = ['27','42','11','88','34','19','55','73','66','22','91','17','48','36','80','14','63','29','57','44'];

function generateRoomCode() {
  const a = WORDS_A[Math.floor(Math.random() * WORDS_A.length)];
  const b = WORDS_A[Math.floor(Math.random() * WORDS_A.length)];
  const n = WORDS_B[Math.floor(Math.random() * WORDS_B.length)];
  return `${a}-${b}-${n}`;
}

function openRoom() {
  // Reset room screen state
  $('#newCodeBanner').classList.add('hidden');
  $('#joinRoomForm').classList.add('hidden');
  $('#joinRoomCode').value = '';
  $('#joinRoomCard').classList.remove('expanded');
  $('#roomMessage').textContent = '';

  // Personalised greeting
  const name = state.user?.username || 'there';
  $('#roomGreet').textContent = `Hello, ${name}. Choose how to enter your room.`;

  showView(roomView);
}

function logout() {
  sessionStorage.removeItem('ll_active_user');
  state.user = null;
  state.room = null;
  showView(libraryView);
  showToast('You have been logged out.');
}

// ── Create room ──────────────────────────────────────────────
$('#createRoomBtn').addEventListener('click', () => {
  const code = generateRoomCode();
  $('#generatedCode').textContent = code;
  $('#newCodeBanner').classList.remove('hidden');
  // Collapse join form if open
  $('#joinRoomForm').classList.add('hidden');
  $('#joinRoomCard').classList.remove('expanded');
  // Scroll into view
  $('#newCodeBanner').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

// ── Copy code ────────────────────────────────────────────────
$('#copyCodeBtn').addEventListener('click', async () => {
  const code = $('#generatedCode').textContent;
  try {
    await navigator.clipboard.writeText(code);
  } catch {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = code; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
  const btn = $('#copyCodeBtn');
  const prev = btn.innerHTML;
  btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M20 6 9 17l-5-5"/></svg> Copied!';
  btn.classList.add('copied');
  setTimeout(() => { btn.innerHTML = prev; btn.classList.remove('copied'); }, 2000);
});

// ── Enter created room ───────────────────────────────────────
$('#enterCreatedRoom').addEventListener('click', () => {
  const code = $('#generatedCode').textContent;
  if (code) openChat(code);
});

// ── Join room toggle ─────────────────────────────────────────
$('#joinRoomCard').addEventListener('click', () => {
  const form = $('#joinRoomForm');
  const isOpen = !form.classList.contains('hidden');
  form.classList.toggle('hidden', isOpen);
  $('#joinRoomCard').classList.toggle('expanded', !isOpen);
  // Collapse banner
  if (!isOpen) {
    $('#newCodeBanner').classList.add('hidden');
    setTimeout(() => $('#joinRoomCode').focus(), 80);
  }
});

// ── Join form submit ─────────────────────────────────────────
$('#joinRoomForm').addEventListener('submit', e => {
  e.preventDefault();
  const code = $('#joinRoomCode').value.trim();
  if (!code) {
    $('#roomMessage').textContent = 'Please enter a room code.';
    return;
  }
  openChat(code);
});

// Discreet private entry — ✦ button
$('#quietDoor').addEventListener('click', () => {
  state.user ? openRoom() : openAuth('login');
});
$('#quietDoor2').addEventListener('click', () => {
  state.user ? openRoom() : openAuth('login');
});

// Keyboard shortcut: Shift + .
document.addEventListener('keydown', e => {
  if (e.shiftKey && e.key === '.' && !e.repeat) {
    const anyModalOpen = !authView.classList.contains('hidden') ||
                         !roomView.classList.contains('hidden') ||
                         !chatView.classList.contains('hidden');
    if (!anyModalOpen) {
      state.user ? openRoom() : openAuth('login');
    }
  }
  if (e.key === 'Escape') {
    if (!authView.classList.contains('hidden')) showView(libraryView);
    if (!roomView.classList.contains('hidden')) showView(libraryView);
  }
});

// Close buttons
$$('[data-close]').forEach(btn => btn.addEventListener('click', () => showView(libraryView)));
$('#roomBack').addEventListener('click', () => showView(libraryView));

// Toggle login ↔ signup
$('#toggleAuth').addEventListener('click', () => {
  openAuth(state.mode === 'login' ? 'signup' : 'login');
});

// Password visibility toggle
$$('.pw-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = btn.previousElementSibling;
    const isText = input.type === 'text';
    input.type = isText ? 'password' : 'text';
    btn.setAttribute('aria-label', isText ? 'Show password' : 'Hide password');
  });
});

// Auth form submit
$('#authForm').addEventListener('submit', e => {
  e.preventDefault();
  const username = $('#username').value.trim();
  const password = $('#password').value;
  const access   = $('#accessCode').value.trim();
  const msgEl    = $('#authMessage');
  msgEl.textContent = '';

  if (!username || !password || !access) { msgEl.textContent = 'Please fill in all fields.'; return; }

  const list = getUsers();

  if (state.mode === 'signup') {
    if (list.length >= 2) { msgEl.textContent = 'This private space already has two accounts.'; return; }
    if (password !== $('#confirmPassword').value) { msgEl.textContent = 'Passwords do not match.'; return; }
    if (password.length < 8) { msgEl.textContent = 'Password must be at least 8 characters.'; return; }
    if (list.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      msgEl.textContent = 'That username is taken. Choose another.'; return;
    }
    const role = list.length === 0 ? 'admin' : 'partner';
    list.push({ username, password: btoa(password), access: btoa(access), role });
    saveUsers(list);
    state.user = { username, role };
    sessionStorage.setItem('ll_active_user', JSON.stringify(state.user));
    showToast('Your private account is ready ✦');
    openRoom();
    return;
  }

  // Login
  const user = list.find(
    u => u.username.toLowerCase() === username.toLowerCase() &&
         atob(u.password) === password &&
         atob(u.access) === access
  );
  if (!user) { msgEl.textContent = "The login details don't match."; return; }
  state.user = { username: user.username, role: user.role };
  sessionStorage.setItem('ll_active_user', JSON.stringify(state.user));
  openRoom();
});

// Room back → library (NOT logout)
$('#logout').addEventListener('click', logout);

/* ═══════════════════════════════════════════════
   CHAT
═══════════════════════════════════════════════ */

function openChat(code) {
  state.room = code;
  $('#chatCodeLabel').textContent = `Room · ${code}`;
  const initial = (state.user?.username || 'U').slice(0, 1).toUpperCase();
  $('#chatAvatarInitial').textContent = initial;
  $('#popoverAvatar').textContent     = initial;
  $('#popoverUsername').textContent   = state.user?.username || '';
  $('#popoverRole').textContent       = state.user?.role === 'admin' ? '★ Owner' : 'Partner';
  renderMessages();
  showView(chatView);
}

function renderMessages() {
  const list = $('#messageList');
  const msgs = getMessages(state.room);
  
  if (!msgs.length) {
    list.innerHTML = `
      <div class="empty-chat" role="status">
        <span aria-hidden="true">✦</span>
        <p>This is the beginning of your private conversation.</p>
        <p>Messages disappear after 5 minutes.</p>
      </div>`;
    return;
  }

  let needsSave = false;
  list.innerHTML = '';
  
  const frag = document.createDocumentFragment();
  msgs.forEach(msg => {
    const isMe = msg.user === state.user?.username;
    
    // Mark as seen if it's from the other user
    if (!isMe && msg.status !== 'seen') {
      msg.status = 'seen';
      needsSave = true;
    }

    let ticks = '';
    if (isMe) {
      const isSeen = msg.status === 'seen';
      ticks = `
        <span class="msg-tick ${isSeen ? 'seen' : ''}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
            ${isSeen ? '<polyline points="24 6 13 17 9.5 13.5"></polyline>' : ''}
          </svg>
        </span>
      `;
    }

    const div = document.createElement('div');
    div.className = `message ${isMe ? 'me' : ''}`;
    div.innerHTML = `
      <span>${esc(msg.text)}</span>
      <div class="msg-meta">
        <time>${esc(msg.user)} · ${fmtTime(msg.at)}</time>
        ${ticks}
      </div>
    `;
    frag.appendChild(div);
  });

  list.appendChild(frag);
  list.scrollTop = list.scrollHeight;
  
  if (needsSave) {
    saveMessages(state.room, msgs);
  }
}

// ── Typing Indicator ──
let typingTimer;
const typingKey = () => `ll_typing_${state.room}`;

$('#messageInput').addEventListener('input', () => {
  if (!state.room || !state.user) return;
  localStorage.setItem(typingKey(), state.user.username);
  
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => {
    localStorage.removeItem(typingKey());
  }, 1500);
});

// ── Send Message ──
$('#messageForm').addEventListener('submit', e => {
  e.preventDefault();
  const input = $('#messageInput');
  const text  = input.value.trim();
  if (!text || !state.room) return;
  
  const msgs = getMessages(state.room);
  msgs.push({
    id: Date.now().toString(),
    user: state.user.username,
    text,
    at: new Date().toISOString(),
    status: 'sent'
  });
  saveMessages(state.room, msgs);
  
  input.value = '';
  localStorage.removeItem(typingKey());
  
  renderMessages();
  input.focus();
});

// ── Real-time Sync (via localStorage) ──
window.addEventListener('storage', e => {
  if (!state.room) return;
  
  // New message / status change
  if (e.key === msgKey(state.room)) {
    renderMessages();
  }
  
  // Typing indicator
  if (e.key === typingKey()) {
    const indicator = $('#typingIndicator');
    if (e.newValue && e.newValue !== state.user.username) {
      indicator.classList.remove('hidden');
      $('#messageList').scrollTop = $('#messageList').scrollHeight;
    } else {
      indicator.classList.add('hidden');
    }
  }
});

// Chat back → rooms
$('#chatBack').addEventListener('click', openRoom);

// Popover
const chatPopover = $('#chatPopover');
$('#chatMenu').addEventListener('click', () => {
  const isOpen = !chatPopover.classList.contains('hidden');
  chatPopover.classList.toggle('hidden', isOpen);
  $('#chatMenu').setAttribute('aria-expanded', String(!isOpen));
});
$('#goRooms').addEventListener('click', () => { chatPopover.classList.add('hidden'); openRoom(); });
$('#quickExit').addEventListener('click', () => {
  chatPopover.classList.add('hidden');
  state.room = null;
  showView(libraryView);
});
$('#logoutChat').addEventListener('click', () => { chatPopover.classList.add('hidden'); logout(); });

// Close popover clicking elsewhere
document.addEventListener('click', e => {
  if (!chatPopover.classList.contains('hidden') &&
      !e.target.closest('#chatPopover') &&
      !e.target.closest('#chatMenu')) {
    chatPopover.classList.add('hidden');
    $('#chatMenu').setAttribute('aria-expanded', 'false');
  }
});

// Call stubs
$('#audioCall').addEventListener('click', () =>
  showToast('Audio calling — real WebRTC in the Supabase version.')
);
$('#videoCall').addEventListener('click', () =>
  showToast('Video calling — real WebRTC in the Supabase version.')
);
$('#attachBtn').addEventListener('click', () =>
  showToast('Attachment upload coming with Supabase Storage.')
);

// Emoji picker
const EMOJIS = ['😊','❤️','✨','📚','🌿','🌸','☕','🌙','🦋','🌺','💫','🎶','🌈','🍃','💌','✦','🌻','🎵','💝','🌷','📖','🏡','🌾','🍂','🕯️','🌅','🦌','🍵','🌸','🪴','💐','🎨'];
const emojiGrid = $('#emojiGrid');
EMOJIS.forEach(emoji => {
  const btn = document.createElement('button');
  btn.type  = 'button';
  btn.textContent = emoji;
  btn.setAttribute('aria-label', emoji);
  btn.addEventListener('click', () => {
    const input = $('#messageInput');
    input.value += emoji;
    input.focus();
    $('#emojiPicker').classList.add('hidden');
  });
  emojiGrid.appendChild(btn);
});
$('#emojiBtn').addEventListener('click', e => {
  e.stopPropagation();
  $('#emojiPicker').classList.toggle('hidden');
});
document.addEventListener('click', e => {
  if (!$('#emojiPicker').classList.contains('hidden') &&
      !e.target.closest('#emojiPicker') &&
      !e.target.closest('#emojiBtn')) {
    $('#emojiPicker').classList.add('hidden');
  }
});

/* ═══════════════════════════════════════════════
   HERO IMAGES — load progressively
═══════════════════════════════════════════════ */
async function loadHeroImages() {
  try {
    const [booksData, natureData] = await Promise.all([
      fetchPexels('books reading cozy', 1, 3),
      fetchPexels('nature calm landscape', 1, 2),
    ]);

    const heroImgs = document.querySelectorAll('.hero-card img');
    const photos = [
      ...(booksData?.photos || []),
      ...(natureData?.photos || []),
    ];

    photos.slice(0, 3).forEach((photo, i) => {
      if (heroImgs[i]) {
        const newImg = new Image();
        newImg.onload = () => { heroImgs[i].src = newImg.src; };
        newImg.src = photo.src.medium;
        newImg.alt = photo.alt || 'Reading inspiration';
      }
    });
  } catch {
    // Keep fallback images
  }
}

/* ═══════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════ */

// Restore session
if (state.user) {
  // User was logged in — show library (they'll nav to room)
}

// Show library first
showView(libraryView);

// Load initial pins
loadPins('all', 1, false);

// Load hero images from API in background
loadHeroImages();

// Restore nav link from hash
const hashMap = { '#shelves': 'Browse', '#collection': 'Collections', '#notes': 'Notes' };
const activeLink = hashMap[window.location.hash];
if (activeLink) {
  $$('.nav-link').forEach(a => {
    a.classList.toggle('active', a.textContent === activeLink);
  });
}
$$('.nav-link, .mobile-drawer nav a').forEach(a => {
  a.addEventListener('click', () => {
    $$('.nav-link').forEach(l => l.classList.remove('active'));
    document.querySelectorAll(`.nav-link[href="${a.getAttribute('href')}"]`)
      .forEach(l => l.classList.add('active'));
  });
});

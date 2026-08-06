const fs = require('fs');
let content = fs.readFileSync('src/app/page.tsx', 'utf8');

// 1. Replace Keywords array completely
const keywordsStart = content.indexOf('const AESTHETIC_KEYWORDS = [');
const keywordsEnd = content.indexOf('];', keywordsStart) + 2;
const currentKeywordsStr = content.substring(keywordsStart, keywordsEnd);

const newKeywords = `const AESTHETIC_KEYWORDS = [
  "Aesthetic typography quotes", "Minimalist text quotes aesthetic", "Vintage typewriter quotes",
  "Vintage books and coffee aesthetic", "Dark academia books and candles", "Old bookstore aesthetic",
  "Dreamy golden hour sunset photography", "Cinematic sky dramatic clouds aesthetic", "Warm orange glow sky",
  "Whimsical forest path aesthetic", "Sunlit leaves emerald green", "Mossy green cottage window",
  "Pakistani suit aesthetic pastel embroidery", "Traditional Pakistani palazzo suits", "Chikankari white kurta",
  "Indian traditional saree aesthetic minimal", "Modest fashion Eid outfit pastel",
  "Islamic architecture aesthetic mosque", "Mughal architecture aesthetic patterns",
  "Arabic calligraphy aesthetic minimal", "Islamic art aesthetic",
  "Minimalist coffee shop aesthetic", "Cozy lifestyle workspace coffee",
  "Aesthetic interior design minimal wabi sabi", "Soft pastel flowers aesthetic",
  "Vintage travel aesthetic Europe", "Aesthetic food photography minimal"
];

const CATEGORY_MAPPINGS: Record<string, string[]> = {
  "aesthetic quotes": ["Aesthetic typography quotes", "Minimalist aesthetic quotes text", "Handwritten journal quotes"],
  "motivational": ["Motivational typography aesthetic", "Positive affirmations text", "Success quotes minimal"],
  "study": ["Cozy reading corner aesthetic", "Dark academia books", "Study desk aesthetic coffee"],
  "short quotes": ["Short meaningful quotes text", "Minimalist words aesthetic", "Typewriter short quotes"],
  "life": ["Lifestyle coffee shop aesthetic", "Slow living aesthetic", "Peaceful nature aesthetic life"],
  "inspirational": ["Inspiring architecture aesthetic", "Beautiful sunset golden hour", "Islamic calligraphy aesthetic"],
  "meaningful": ["Poetry quotes aesthetic", "Deep meaningful art aesthetic", "Minimalist text quotes"]
};
`;

content = content.replace(currentKeywordsStr, newKeywords);

// 2. Add state
const stateInsertionPoint = content.indexOf('const [isDrawerOpen, setDrawerOpen] = useState(false);');
content = content.replace('const [isDrawerOpen, setDrawerOpen] = useState(false);', 
  `const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [isDrawerOpen, setDrawerOpen] = useState(false);`);

// 3. Rewrite fetchInitial
const fetchInitialRegex = /const fetchInitial = async \(\) => \{[\s\S]*?\};\n    fetchInitial\(\);/m;
const newFetchInitial = `const fetchInitial = async () => {
      setIsLoading(true);
      
      let photos: any[] = [];
      const fetchMix = async (q1: string, q2: string, p1: number, p2: number) => {
        const [px, pb] = await Promise.all([
          fetchPexelsImages(q1, p1, 15),
          fetchPixabayImages(q2, p2, 15)
        ]);
        return shuffleArray([...(px.photos || []), ...(pb.photos || [])]);
      };

      if (activeSearch) {
        // Search overrides everything
        const q = \`\${activeSearch} aesthetic (modest OR traditional)\`;
        photos = await fetchMix(q, activeSearch + ' aesthetic', 1, 1);
      } else if (activeCategory === 'all') {
        const shuffled = shuffleArray(AESTHETIC_KEYWORDS);
        const r1 = Math.floor(Math.random() * 5) + 1;
        const r2 = Math.floor(Math.random() * 5) + 1;
        photos = await fetchMix(shuffled[0], shuffled[1], r1, r2);
      } else {
        const mapped = CATEGORY_MAPPINGS[activeCategory] || [\`\${activeCategory} aesthetic modest\`];
        const shuffled = shuffleArray(mapped);
        const q1 = shuffled[0];
        const q2 = shuffled.length > 1 ? shuffled[1] : shuffled[0];
        const r1 = Math.floor(Math.random() * 4) + 1;
        const r2 = Math.floor(Math.random() * 4) + 1;
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
    fetchInitial();`;

content = content.replace(fetchInitialRegex, newFetchInitial);

// 4. Rewrite fetchMore
const fetchMoreRegex = /const fetchMore = async \(\) => \{[\s\S]*?fetchMore\(\);/m;
const newFetchMore = `const fetchMore = async () => {
          setIsLoading(true);
          
          let newPhotos: any[] = [];
          const fetchMix = async (q1: string, q2: string, p1: number, p2: number) => {
            const [px, pb] = await Promise.all([
              fetchPexelsImages(q1, p1, 15),
              fetchPixabayImages(q2, p2, 15)
            ]);
            return shuffleArray([...(px.photos || []), ...(pb.photos || [])]);
          };

          if (activeSearch) {
            const q = \`\${activeSearch} aesthetic (modest OR traditional)\`;
            newPhotos = await fetchMix(q, activeSearch + ' aesthetic', page, page);
          } else if (activeCategory === 'all') {
            const shuffled = shuffleArray(AESTHETIC_KEYWORDS);
            newPhotos = await fetchMix(shuffled[0], shuffled[1], page, page);
          } else {
            const mapped = CATEGORY_MAPPINGS[activeCategory] || [\`\${activeCategory} aesthetic modest\`];
            const shuffled = shuffleArray(mapped);
            const q1 = shuffled[0];
            const q2 = shuffled.length > 1 ? shuffled[1] : shuffled[0];
            newPhotos = await fetchMix(q1, q2, page, page);
          }
          
          if (newPhotos.length > 0) {
            setPins(current => {
              return deduplicatePins([...current, ...newPhotos]);
            });
            setPage(prev => prev + 1);
          } else {
            setHasMore(false);
          }
          setIsLoading(false);
        };
        fetchMore();`;

content = content.replace(fetchMoreRegex, newFetchMore);
content = content.replace(/activeCategory\]/g, 'activeSearch, activeCategory]');

// 5. Update Search UI
const searchBarRegex = /<div className="search-wrap" role="search">[\s\S]*?<\/div>/;
const newSearchBar = `<form className="search-wrap" role="search" onSubmit={(e) => { e.preventDefault(); setActiveCategory('all'); setActiveSearch(searchQuery); }}>
          <span className="search-icon" aria-hidden="true" onClick={() => { setActiveCategory('all'); setActiveSearch(searchQuery); }} style={{cursor: 'pointer'}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </span>
          <label htmlFor="searchInput" className="sr-only">Search aesthetics</label>
          <input 
            type="search" 
            id="searchInput" 
            placeholder="Search aesthetics, nature, fashion..." 
            autoComplete="off"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>`;
content = content.replace(searchBarRegex, newSearchBar);

// 6. Conditionally render Hero
const heroRegex = /<section className="hero" id="top" aria-label="Welcome">/;
content = content.replace(heroRegex, `{activeCategory === 'all' && !activeSearch && (
      <section className="hero" id="top" aria-label="Welcome">`);

const afterHeroRegex = /Explore collection\n            <\/button>\n          <\/div>\n        <\/div>\n      <\/section>/;
content = content.replace(afterHeroRegex, `Explore collection
            </button>
          </div>
        </div>
      </section>
      )}`);

// Also update the dependencies of the infinite scroll effect
content = content.replace(/hasMore, isLoading, page, activeCategory\]\);/g, 'hasMore, isLoading, page, activeCategory, activeSearch]);');

// And initial load dependencies
content = content.replace(/\} \], \[activeCategory\]\);/g, '} ], [activeCategory, activeSearch]);');
content = content.replace(/\}, \[activeCategory\]\);/g, '}, [activeCategory, activeSearch]);');
content = content.replace(/activeCategory\]\);/, 'activeCategory, activeSearch]);');


fs.writeFileSync('src/app/page.tsx', content);
console.log('Update script executed successfully');

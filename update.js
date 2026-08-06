const fs = require('fs');
let content = fs.readFileSync('src/app/page.tsx', 'utf8');

// 1. Add imports
content = content.replace('import { fetchPexelsImages } from "@/app/actions/pexels";', 
`import { fetchPexelsImages } from "@/app/actions/pexels";
import { fetchPixabayImages } from "@/app/actions/pixabay";
import { LazyImage } from "@/app/components/LazyImage";`);

// 2. Add helpers right before 'export default function Home()'
const helpers = `
const AESTHETIC_KEYWORDS = [
  "Minimalist wool coat outfit casual",
  "Korean aesthetic winter fashion long coat",
  "Oversized trench coat aesthetic beige",
  "Old money winter style aesthetic coat",
  "Chic long black coat outfit street style",
  "Vintage academia trench coat styling",
  "Neutral tone minimalist winter capsule wardrobe",
  "Parisian chic long coat street style",
  "Cozy oversized wool jacket winter aesthetic",
  "Dreamy golden hour sunset photography",
  "Cinematic sky dramatic clouds aesthetic",
  "Sun rays aesthetic peaceful nature",
  "Soft girl aesthetic blurred sunset over fields",
  "Pretty sunset beach vibes desktop wallpaper",
  "Warm orange glow aesthetic sky background",
  "Retro vintage sunset polaroid aesthetics",
  "Grainy lo-fi sunset aesthetic aesthetic",
  "Calm ocean horizon golden hour photography",
  "Whimsical forest path aesthetic green",
  "Enchanted forest lush green photography",
  "Ethereal nature aesthetic weeping willow",
  "Dark green mystical landscape fairycore",
  "Soft green dreamy cottagecore garden",
  "Mossy green cottage window view aesthetic",
  "Foggy morning green woods moody wallpaper",
  "Sunlit leaves emerald green aesthetic",
  "Secret fairy garden hidden path aesthetic",
  "Pakistani suit aesthetic pastel embroidery",
  "Soft girl aesthetic ethnic wear pastel kurta",
  "Traditional Pakistani palazzo suits elegant look",
  "Organza dupatta embroidered festive suit set",
  "Modest fashion Eid outfit pastel green",
  "Anarkali frock design elegant details",
  "Lawn suit neck designs intricate lace",
  "Chikankari white kurta aesthetic styling",
  "Velvet formal dress Pakistani fashion design"
];

const shuffleArray = (array) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

const deduplicatePins = (pins) => {
  const seen = new Set();
  return pins.filter(pin => {
    const key = pin.src?.large2x || pin.src?.large || pin.src;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
`;
content = content.replace('export default function Home() {', helpers + '\nexport default function Home() {');

// 3. Replace fetchInitial
const fetchInitialRegex = /const fetchInitial = async \(\) => \{[\s\S]*?\};\n    fetchInitial\(\);/m;
const newFetchInitial = `const fetchInitial = async () => {
      setIsLoading(true);
      
      let photos = [];
      if (activeCategory === 'all') {
        const shuffled = shuffleArray(AESTHETIC_KEYWORDS);
        const randomPagePx = Math.floor(Math.random() * 5) + 1;
        const randomPagePb = Math.floor(Math.random() * 5) + 1;
        
        const [pexelsRes, pixabayRes] = await Promise.all([
          fetchPexelsImages(shuffled[0], randomPagePx, 15),
          fetchPixabayImages(shuffled[1], randomPagePb, 15)
        ]);
        
        photos = shuffleArray([...(pexelsRes.photos || []), ...(pixabayRes.photos || [])]);
      } else {
        const query = activeCategory.includes('quotes') ? activeCategory : \`\${activeCategory} quotes\`;
        const res = await fetchPexelsImages(query, 1, 30);
        photos = res.photos || [];
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

// 4. Replace fetchMore
const fetchMoreRegex = /const fetchMore = async \(\) => \{[\s\S]*?fetchMore\(\);/m;
const newFetchMore = `const fetchMore = async () => {
          setIsLoading(true);
          
          let newPhotos = [];
          if (activeCategory === 'all') {
            const shuffled = shuffleArray(AESTHETIC_KEYWORDS);
            const [pexelsRes, pixabayRes] = await Promise.all([
              fetchPexelsImages(shuffled[0], page, 15),
              fetchPixabayImages(shuffled[1], page, 15)
            ]);
            newPhotos = shuffleArray([...(pexelsRes.photos || []), ...(pixabayRes.photos || [])]);
          } else {
            const query = activeCategory.includes('quotes') ? activeCategory : \`\${activeCategory} quotes\`;
            const res = await fetchPexelsImages(query, page, 30);
            newPhotos = res.photos || [];
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

// 5. Replace img tag with LazyImage
content = content.replace(/<img src=\{pin\.src\?\.large2x \|\| pin\.src\?\.large \|\| pin\.src\} alt=\{pin\.alt \|\| "Aesthetic"\} loading="lazy" style=\{\{display: 'block', width: '100%', borderRadius: '16px'\}\} \/>/g, 
`<LazyImage 
                    src={pin.src?.large2x || pin.src?.large || pin.src} 
                    alt={pin.alt || "Aesthetic"} 
                    className="w-full block rounded-[16px]"
                    style={pin.width && pin.height ? { aspectRatio: \`\${pin.width} / \${pin.height}\` } : { minHeight: '300px' }}
                  />`);

fs.writeFileSync('src/app/page.tsx', content);
console.log('Update complete.');

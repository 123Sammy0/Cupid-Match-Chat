"use server";

export async function fetchPexelsImages(query: string, page: number = 1, perPage: number = 20) {
  const apiKey = process.env.PEXELS_API_KEY;
  
  if (!apiKey) {
    console.warn("PEXELS_API_KEY is not set in environment variables.");
    // Return mock data if key is missing so UI doesn't crash
    return {
      photos: Array.from({ length: perPage }).map((_, i) => ({
        id: `mock-${query}-${page}-${i}`,
        src: { large2x: `https://placehold.co/400x600/eaeaea/a8a8a8?text=Add+API+Key` },
        url: "#",
      })),
      error: "API key missing. Please add PEXELS_API_KEY to .env.local"
    };
  }

  try {
    const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`, {
      headers: {
        Authorization: apiKey,
      },
      next: { revalidate: 600 } // cache for 10 mins
    });

    if (!res.ok) {
      throw new Error(`Pexels API error: ${res.statusText}`);
    }

    const data = await res.json();
    
    // Normalize and filter out low-res images (< 800px)
    const validPhotos = data.photos
      .filter((photo: any) => photo.width >= 800 && photo.height >= 800)
      .map((photo: any) => {
        const rawAlt = photo.alt ? photo.alt.trim() : "";
        const cleanTitle = rawAlt 
          ? rawAlt.length > 50 
            ? rawAlt.substring(0, 48) + "…" 
            : rawAlt
          : "Aesthetic Moment";
        
        const description = rawAlt
          ? `${rawAlt}. Captured by ${photo.photographer || "an artist"}.`
          : `Curated visual captured with gentle lighting and rich aesthetic warmth by ${photo.photographer || "artist"}.`;

        const queryTags = query.split(/\s+/).filter(t => t.length > 2);
        const tags = Array.from(new Set(["aesthetic", ...queryTags, ...(photo.photographer ? [photo.photographer.toLowerCase()] : [])])).slice(0, 5);

        return {
          ...photo,
          title: cleanTitle,
          description: description,
          provider: 'pexels',
          alt: rawAlt || cleanTitle,
          photographer: photo.photographer || "Curated Artist",
          photographer_url: photo.photographer_url || photo.url,
          photographer_avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(photo.photographer || 'Photographer')}&backgroundColor=e8d98a,c48a6e,4f8b6e`,
          tags: tags,
          avg_color: photo.avg_color || "#FAF6EE"
        };
      });

    return { photos: validPhotos, error: null };
  } catch (error: any) {
    console.error("Error fetching Pexels images:", error);
    return { photos: [], error: error.message };
  }
}

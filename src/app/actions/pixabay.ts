"use server";

export async function fetchPixabayImages(query: string, page: number = 1, perPage: number = 20) {
  const apiKey = process.env.PIXABAY_API_KEY || "57023727-0d7c5c592f1d1458326225fc9";
  
  if (!apiKey) {
    return { photos: [], error: "API key missing" };
  }

  try {
    // We request 'photo' type and mix orientations by not specifying 'orientation' parameter.
    // That gives a healthy mix of landscape, portrait, and square.
    const res = await fetch(`https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}&image_type=photo&safesearch=true`, {
      next: { revalidate: 600 } // cache for 10 minutes (600s)
    });

    if (!res.ok) {
      throw new Error(`Pixabay API error: ${res.statusText}`);
    }

    const data = await res.json();
    
    // Normalize and filter out low-res images (< 800px on either side)
    const validPhotos = data.hits.filter((hit: any) => hit.imageWidth >= 800 && hit.imageHeight >= 800).map((hit: any) => {
      const rawTags = hit.tags ? hit.tags.split(',').map((t: string) => t.trim()) : [];
      const cleanTitle = rawTags.length > 0
        ? rawTags.slice(0, 3).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' • ')
        : "Aesthetic Inspiration";
      
      const description = `Curated visual captured by ${hit.user || 'Artist'}. Keywords: ${hit.tags || 'aesthetic'}.`;

      return {
        id: `pixabay-${hit.id}`,
        src: {
          large2x: hit.largeImageURL,
          large: hit.largeImageURL,
          medium: hit.webformatURL,
        },
        title: cleanTitle,
        description: description,
        url: hit.pageURL,
        alt: hit.tags || cleanTitle,
        width: hit.imageWidth,
        height: hit.imageHeight,
        provider: 'pixabay',
        photographer: hit.user || "Featured Creator",
        photographer_url: `https://pixabay.com/users/${encodeURIComponent(hit.user || '')}-${hit.user_id}/`,
        photographer_avatar: hit.userImageURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(hit.user || 'Creator')}&backgroundColor=c48a6e,4f8b6e,a8924a`,
        tags: rawTags.length > 0 ? rawTags : ["aesthetic", "photography", "mood"],
        likes: hit.likes || 0,
        views: hit.views || 0,
        avg_color: "#F0E8D8"
      };
    });

    return { photos: validPhotos, error: null };
  } catch (error: any) {
    console.error("Error fetching Pixabay images:", error);
    return { photos: [], error: error.message };
  }
}

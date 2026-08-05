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
    const validPhotos = data.hits.filter((hit: any) => hit.imageWidth >= 800 && hit.imageHeight >= 800).map((hit: any) => ({
      id: `pixabay-${hit.id}`,
      src: {
        large2x: hit.largeImageURL,
        large: hit.largeImageURL,
        medium: hit.webformatURL,
      },
      url: hit.pageURL,
      alt: hit.tags,
      width: hit.imageWidth,
      height: hit.imageHeight,
      provider: 'pixabay'
    }));

    return { photos: validPhotos, error: null };
  } catch (error: any) {
    console.error("Error fetching Pixabay images:", error);
    return { photos: [], error: error.message };
  }
}

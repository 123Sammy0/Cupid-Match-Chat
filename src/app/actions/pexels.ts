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
      next: { revalidate: 3600 } // cache for 1 hour
    });

    if (!res.ok) {
      throw new Error(`Pexels API error: ${res.statusText}`);
    }

    const data = await res.json();
    return { photos: data.photos, error: null };
  } catch (error: any) {
    console.error("Error fetching Pexels images:", error);
    return { photos: [], error: error.message };
  }
}

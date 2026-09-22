/**
 * Geocoding Utility for ZeroPlate AI
 * Translates address and locality strings into precise geographic coordinates (lat, lng)
 * using the Mapbox Geocoding API, with built-in in-memory caching and city-level fallbacks.
 */

interface GeoCoordinate {
  lat: number;
  lng: number;
}

const geocodeCache = new Map<string, GeoCoordinate>();

// Well-known fallback regional centroids (India metropolitan zones)
const CITY_CENTROIDS: Record<string, GeoCoordinate> = {
  bangalore: { lat: 12.9716, lng: 77.5946 },
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  delhi: { lat: 28.6139, lng: 77.209 },
  "new delhi": { lat: 28.6139, lng: 77.209 },
  noida: { lat: 28.5355, lng: 77.391 },
  gurgaon: { lat: 28.4595, lng: 77.0266 },
  gurugram: { lat: 28.4595, lng: 77.0266 },
  mumbai: { lat: 19.076, lng: 72.8777 },
  pune: { lat: 18.5204, lng: 73.8567 },
  hyderabad: { lat: 17.385, lng: 78.4867 },
  chennai: { lat: 13.0827, lng: 80.2707 },
  kolkata: { lat: 22.5726, lng: 88.3639 },
};

export async function geocodeAddress(
  address: string,
  token?: string
): Promise<GeoCoordinate | null> {
  const query = (address || "").trim();
  if (!query) return null;

  const cacheKey = query.toLowerCase();
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)!;
  }

  const mapboxToken =
    token ||
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
    process.env.MAPBOX_TOKEN;

  if (mapboxToken) {
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        query
      )}.json?access_token=${mapboxToken}&country=in&limit=1`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.features && data.features.length > 0) {
          const [lng, lat] = data.features[0].center;
          const result: GeoCoordinate = {
            lat: Number(lat.toFixed(6)),
            lng: Number(lng.toFixed(6)),
          };
          geocodeCache.set(cacheKey, result);
          return result;
        }
      }
    } catch (err) {
      console.warn(`Mapbox geocoding error for "${query}":`, err);
    }
  }

  // Fallback: match known city keyword in address
  const lower = query.toLowerCase();
  for (const [city, coord] of Object.entries(CITY_CENTROIDS)) {
    if (lower.includes(city)) {
      geocodeCache.set(cacheKey, coord);
      return coord;
    }
  }

  return null;
}

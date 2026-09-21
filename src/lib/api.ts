import type { Location, GeoDBCity, GeoDBResponse } from '@/types/location';

const MIN_QUERY_LENGTH = 2;
const MAX_RESULTS = 7;

function normalizeCity(city: GeoDBCity): Location {
  return {
    id: String(city.id),
    city: city.name,
    region: city.region,
    country: city.country,
    countryCode: city.countryCode,
    population: city.population,
    latitude: city.latitude,
    longitude: city.longitude,
  };
}

export async function searchLocations(
  query: string,
  signal?: AbortSignal
): Promise<Location[]> {
  const trimmed = query.trim();
  if (trimmed.length < MIN_QUERY_LENGTH) return [];

  const params = new URLSearchParams({
    q: trimmed,
    limit: String(MAX_RESULTS),
  });

  const response = await fetch(`/api/locations?${params}`, { signal });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(
      errorBody?.error || `Search failed (${response.status})`
    );
  }

  const data: GeoDBResponse = await response.json();
  return data.data.map(normalizeCity);
}

export { MIN_QUERY_LENGTH };

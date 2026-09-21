import { NextRequest } from 'next/server';

const GEODB_API_URL = 'https://wft-geo-db.p.rapidapi.com/v1/geo/cities';
const GEODB_API_KEY = process.env.GEODB_API_KEY;
const GEODB_API_HOST = 'wft-geo-db.p.rapidapi.com';

interface MockCity {
  id: number;
  name: string;
  region: string;
  country: string;
  countryCode: string;
  population: number;
  latitude: number;
  longitude: number;
}

const MOCK_CITIES: MockCity[] = [
  { id: 1, name: 'Lagos', region: 'Lagos', country: 'Nigeria', countryCode: 'NG', population: 15388000, latitude: 6.455, longitude: 3.3841 },
  { id: 2, name: 'London', region: 'England', country: 'United Kingdom', countryCode: 'GB', population: 8982000, latitude: 51.5074, longitude: -0.1278 },
  { id: 3, name: 'Los Angeles', region: 'California', country: 'United States', countryCode: 'US', population: 3979000, latitude: 34.0522, longitude: -118.2437 },
  { id: 4, name: 'Lisbon', region: 'Lisbon', country: 'Portugal', countryCode: 'PT', population: 505000, latitude: 38.7223, longitude: -9.1393 },
  { id: 5, name: 'Lima', region: 'Lima', country: 'Peru', countryCode: 'PE', population: 10719000, latitude: -12.0464, longitude: -77.0428 },
  { id: 6, name: 'Lahore', region: 'Punjab', country: 'Pakistan', countryCode: 'PK', population: 13000000, latitude: 31.5497, longitude: 74.3436 },
  { id: 7, name: 'Lekki', region: 'Lagos', country: 'Nigeria', countryCode: 'NG', population: 120000, latitude: 6.4698, longitude: 3.5852 },
  { id: 8, name: 'Abuja', region: 'Federal Capital Territory', country: 'Nigeria', countryCode: 'NG', population: 3464000, latitude: 9.0579, longitude: 7.4951 },
  { id: 9, name: 'Accra', region: 'Greater Accra', country: 'Ghana', countryCode: 'GH', population: 2514000, latitude: 5.6037, longitude: -0.187 },
  { id: 10, name: 'Nairobi', region: 'Nairobi', country: 'Kenya', countryCode: 'KE', population: 4735000, latitude: -1.2921, longitude: 36.8219 },
  { id: 11, name: 'Ibadan', region: 'Oyo', country: 'Nigeria', countryCode: 'NG', population: 3649000, latitude: 7.3776, longitude: 3.9470 },
  { id: 12, name: 'Kano', region: 'Kano', country: 'Nigeria', countryCode: 'NG', population: 4103000, latitude: 12.0022, longitude: 8.5920 },
  { id: 13, name: 'Port Harcourt', region: 'Rivers', country: 'Nigeria', countryCode: 'NG', population: 1865000, latitude: 4.8156, longitude: 7.0498 },
  { id: 14, name: 'New York', region: 'New York', country: 'United States', countryCode: 'US', population: 8336000, latitude: 40.7128, longitude: -74.0060 },
  { id: 15, name: 'Paris', region: 'Île-de-France', country: 'France', countryCode: 'FR', population: 2161000, latitude: 48.8566, longitude: 2.3522 },
  { id: 16, name: 'Dubai', region: 'Dubai', country: 'United Arab Emirates', countryCode: 'AE', population: 3331000, latitude: 25.2048, longitude: 55.2708 },
  { id: 17, name: 'Cape Town', region: 'Western Cape', country: 'South Africa', countryCode: 'ZA', population: 4618000, latitude: -33.9249, longitude: 18.4241 },
  { id: 18, name: 'Cairo', region: 'Cairo', country: 'Egypt', countryCode: 'EG', population: 10100000, latitude: 30.0444, longitude: 31.2357 },
  { id: 19, name: 'Dar es Salaam', region: 'Dar es Salaam', country: 'Tanzania', countryCode: 'TZ', population: 7405000, latitude: -6.7924, longitude: 39.2083 },
  { id: 20, name: 'Ikoyi', region: 'Lagos', country: 'Nigeria', countryCode: 'NG', population: 60000, latitude: 6.4490, longitude: 3.4346 },
  { id: 21, name: 'Victoria Island', region: 'Lagos', country: 'Nigeria', countryCode: 'NG', population: 80000, latitude: 6.4281, longitude: 3.4219 },
  { id: 22, name: 'Ajah', region: 'Lagos', country: 'Nigeria', countryCode: 'NG', population: 250000, latitude: 6.4667, longitude: 3.5833 },
];

function searchMockCities(query: string, limit: number): MockCity[] {
  const lower = query.toLowerCase();
  return MOCK_CITIES
    .filter(city =>
      city.name.toLowerCase().startsWith(lower) ||
      city.region.toLowerCase().startsWith(lower) ||
      city.country.toLowerCase().startsWith(lower)
    )
    .sort((a, b) => b.population - a.population)
    .slice(0, limit);
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = searchParams.get('q');
  const limit = Math.min(Number(searchParams.get('limit')) || 7, 10);

  if (!query || query.trim().length < 2) {
    return Response.json(
      { error: 'Query must be at least 2 characters' },
      { status: 400 }
    );
  }

  // Use mock data when no API key is configured
  if (!GEODB_API_KEY) {
    const results = searchMockCities(query.trim(), limit);
    // Simulate network latency for realistic UX testing
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
    return Response.json({
      data: results,
      metadata: { currentOffset: 0, totalCount: results.length },
    });
  }

  try {
    const params = new URLSearchParams({
      namePrefix: query.trim(),
      limit: String(limit),
      sort: '-population',
      languageCode: 'en',
      types: 'CITY',
    });

    const response = await fetch(`${GEODB_API_URL}?${params}`, {
      headers: {
        'X-RapidAPI-Key': GEODB_API_KEY,
        'X-RapidAPI-Host': GEODB_API_HOST,
      },
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return Response.json(
          { error: 'Too many requests. Please wait a moment and try again.' },
          { status: 429 }
        );
      }
      return Response.json(
        { error: `Location service unavailable (${status})` },
        { status: 502 }
      );
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return Response.json({ error: 'Request cancelled' }, { status: 499 });
    }
    return Response.json(
      { error: 'Unable to search locations. Please try again.' },
      { status: 500 }
    );
  }
}

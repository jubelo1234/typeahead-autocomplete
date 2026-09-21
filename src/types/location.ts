export interface Location {
  id: string;
  city: string;
  region: string;
  country: string;
  countryCode: string;
  population: number;
  latitude: number;
  longitude: number;
}

export interface GeoDBCity {
  id: number;
  name: string;
  region: string;
  country: string;
  countryCode: string;
  population: number;
  latitude: number;
  longitude: number;
}

export interface GeoDBResponse {
  data: GeoDBCity[];
  metadata: {
    currentOffset: number;
    totalCount: number;
  };
}

export interface LocationSearchError {
  message: string;
  isAborted: boolean;
}

export type SearchStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';

export type SearchState =
  | { status: 'idle' }
  | { status: 'loading'; query: string }
  | { status: 'success'; query: string; results: Location[] }
  | { status: 'empty'; query: string }
  | { status: 'error'; query: string; message: string };

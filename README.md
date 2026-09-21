# Location Search Typeahead

A production-quality typeahead/autocomplete component built for the Expert Listing frontend engineering screening task.

## Features

- **Instant Search:** Debounced input query mapped to server-side search via the GeoDB Cities API.
- **Resilient Data Flow:** Handles network failures, empty results, and explicitly prevents race conditions (older responses overwriting newer searches) using `AbortController` and request version tracking.
- **Accessible Combobox:** Full WAI-ARIA combobox implementation including keyboard navigation (Up, Down, Enter, Escape), focus management, and screen-reader live announcements.
- **Responsive & Themed:** Mobile-first design, fluid CSS custom properties, and seamless light/dark mode support responding to both system preferences and manual toggling.
- **Zero-Dependency Styling:** Entirely built with CSS Modules for scoped, performant styling.

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript (Strict Mode)
- CSS Modules
- Vitest + React Testing Library (for testing)

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (Optional)
The application works out-of-the-box using mock data if no API key is provided. To use the live GeoDB Cities API:
1. Copy `.env.example` to `.env.local`
2. Obtain a free API key from [RapidAPI (GeoDB Cities)](https://rapidapi.com/wirefreethought/api/geodb-cities)
3. Add your key: `GEODB_API_KEY=your_key_here`

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

## Testing
Run the comprehensive Vitest integration suite:
```bash
npm run test
```
*(Tests cover rendering, debouncing, success/empty/error states, keyboard navigation, selection, and stale-response prevention).*

## Architecture

The architecture separates the presentation layer from the data layer via a Next.js Route Handler (`app/api/locations/route.ts`). This ensures the RapidAPI key remains secure on the server while the client component (`location-search.tsx`) manages the complex combobox state.

The component uses a **discriminated union** for its state machine (`idle | loading | success | empty | error`), making impossible UI states impossible to render.

## Key Engineering Decisions

### Debouncing (300ms)
A custom `useDebounce` hook prevents the API from being hammered on every keystroke. The 300ms delay balances the feeling of "instant" search with efficient network utilization.

### Stale Response Handling
Race conditions are prevented using a dual-strategy:
1. `AbortController` cancels in-flight requests when the query changes, saving bandwidth.
2. A `requestVersionRef` counter guarantees that if a slower, older request somehow resolves after a newer one, the stale data is silently discarded.

### Accessibility
The component strictly adheres to the W3C ARIA Combobox pattern. It avoids "guessing" ARIA attributes and implements proper `aria-activedescendant` focus tracking, polite live regions for status updates, and full keyboard control.

### API Choice
The GeoDB Cities API was selected because it provides genuine server-side prefix filtering (`namePrefix`) and returns rich geographic data (city, region, country, population, lat/lng) highly relevant to the Expert Listing proptech domain.

## Tradeoffs

- **No Global State:** Context/Zustand were deliberately avoided. The search state is purely local UI state, so `useState` is sufficient and keeps the component portable.
- **No TanStack Query:** While excellent for caching, TanStack Query was excluded to minimize dependencies. For a single endpoint, standard fetch + `AbortController` demonstrates fundamental engineering skills better.
- **Custom CSS vs Tailwind:** CSS Modules were chosen to explicitly demonstrate CSS architecture competence without relying on utility classes.

## Scaling Considerations

To scale this to millions of searches:
1. **Edge Caching:** The Next.js API route could leverage Vercel Edge caching or Redis (e.g., Upstash) to cache popular city prefixes.
2. **Rate Limiting:** Implement Upstash Ratelimit on the API route to prevent abuse.
3. **Backend Proxy/Elasticsearch:** Direct RapidAPI calls would be replaced by an internal Elasticsearch or Typesense microservice optimized specifically for geospatial prefix search.

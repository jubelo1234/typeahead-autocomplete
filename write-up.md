# Screening Task Write-Up

**Tradeoffs**  
I went with standard CSS Modules over Tailwind to keep dependencies light and focus on the core logic. For the same reason, I skipped libraries like React Query or Zustand—they're great for large apps, but overkill for a single autocomplete component. Instead, I handled state locally and managed race conditions manually using an `AbortController` and a simple version counter. I also added a basic `Map` cache so backspacing doesn't trigger redundant network requests.

**Scaling for High Traffic**  
If this gets hit with heavy traffic, proxying a third-party API like GeoDB won't hold up. The quickest win would be moving the Next.js API route to an Edge function and putting Redis in front of it to cache common prefixes (like "Lon" or "Lagos"). Long-term, we'd probably want to drop the external API and use our own Elasticsearch or Typesense instance to handle geospatial queries internally.

**Testing**  
I used Vitest and React Testing Library because they focus on how the user actually interacts with the component. The tests use `userEvent` to simulate real typing and fake timers to speed through the 300ms debounce. I also made sure to explicitly test the race condition logic by forcing a mock promise to resolve out of order, just to verify that the UI correctly throws away the stale data.

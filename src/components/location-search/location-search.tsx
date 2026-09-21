'use client';

import { useState, useRef, useCallback, useEffect, useId, useMemo } from 'react';
import type { Location, SearchState } from '@/types/location';
import { searchLocations, MIN_QUERY_LENGTH } from '@/lib/api';
import { useDebounce } from '@/hooks/use-debounce';
import { SearchInput } from './search-input';
import { ResultsList } from './results-list';
import { SearchStatus } from './search-status';
import styles from './location-search.module.css';

const DEBOUNCE_MS = 300;

interface LocationSearchProps {
  onSelect?: (location: Location) => void;
  onClear?: () => void;
}

export function LocationSearch({ onSelect, onClear }: LocationSearchProps) {
  const [query, setQuery] = useState('');
  const [state, setState] = useState<SearchState>({ status: 'idle' });
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);

  const debouncedQuery = useDebounce(query, DEBOUNCE_MS);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  // Tracks request identity to discard stale responses
  const requestVersionRef = useRef(0);
  // Client-side cache for instant results on re-typing
  const cacheRef = useRef(new Map<string, Location[]>());

  const instanceId = useId();
  const listboxId = `${instanceId}-listbox`;

  const results = useMemo(() => (state.status === 'success' ? state.results : []), [state]);
  const showDropdown = isOpen && state.status !== 'idle';

  const activeDescendantId =
    highlightedIndex >= 0 && results.length > 0
      ? `${listboxId}-option-${highlightedIndex}`
      : undefined;

  // Perform search when debounced query changes
  useEffect(() => {
    const trimmed = debouncedQuery.trim();

    if (trimmed.length < MIN_QUERY_LENGTH) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState({ status: 'idle' });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHighlightedIndex(-1);
      return;
    }

    // Cancel any in-flight request
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Check cache first
    const cachedResults = cacheRef.current.get(trimmed);
    if (cachedResults) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState({ status: 'success', query: trimmed, results: cachedResults });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHighlightedIndex(-1);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsOpen(true);
      return;
    }

    const version = ++requestVersionRef.current;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ status: 'loading', query: trimmed });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHighlightedIndex(-1);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsOpen(true);

    searchLocations(trimmed, controller.signal)
      .then((locations) => {
        // Discard if a newer request has been made
        if (requestVersionRef.current !== version) return;

        if (locations.length === 0) {
          setState({ status: 'empty', query: trimmed });
          cacheRef.current.set(trimmed, []);
        } else {
          setState({ status: 'success', query: trimmed, results: locations });
          cacheRef.current.set(trimmed, locations);
        }
      })
      .catch((error: unknown) => {
        if (requestVersionRef.current !== version) return;

        // Aborted requests are intentional — not errors
        if (error instanceof Error && error.name === 'AbortError') return;

        setState({
          status: 'error',
          query: trimmed,
          message:
            error instanceof Error
              ? error.message
              : 'Unable to search locations. Please try again.',
        });
      });

    return () => {
      controller.abort();
    };
  }, [debouncedQuery]);

  const handleSelect = useCallback(
    (location: Location) => {
      setQuery(location.city);
      setState({ status: 'idle' });
      setIsOpen(false);
      setHighlightedIndex(-1);
      onSelect?.(location);
    },
    [onSelect]
  );

  const handleClear = useCallback(() => {
    setQuery('');
    setState({ status: 'idle' });
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
    onClear?.();
  }, [onClear]);

  const handleRetry = useCallback(() => {
    // Bump version and re-trigger the effect by slightly modifying the query
    const currentQuery = query.trim();
    setQuery('');
    // Use microtask to ensure state clears before re-setting
    queueMicrotask(() => setQuery(currentQuery));
  }, [query]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen || results.length === 0) {
        if (e.key === 'Escape') {
          setIsOpen(false);
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < results.length - 1 ? prev + 1 : 0
          );
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : results.length - 1
          );
          break;
        }
        case 'Enter': {
          e.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < results.length) {
            handleSelect(results[highlightedIndex]);
          }
          break;
        }
        case 'Escape': {
          e.preventDefault();
          setIsOpen(false);
          setHighlightedIndex(-1);
          break;
        }
      }
    },
    [isOpen, results, highlightedIndex, handleSelect]
  );

  const handleFocus = useCallback(() => {
    if (state.status !== 'idle') {
      setIsOpen(true);
    }
  }, [state.status]);

  const handleBlur = useCallback(() => {
    setIsOpen(false);
    setHighlightedIndex(-1);
  }, []);

  return (
    <div className={styles.container}>
      <SearchInput
        ref={inputRef}
        value={query}
        onChange={setQuery}
        onClear={handleClear}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        isOpen={showDropdown}
        listboxId={listboxId}
        activeDescendantId={activeDescendantId}
      />
      {showDropdown && (
        <>
          {state.status === 'success' && results.length > 0 && (
            <ResultsList
              results={results}
              highlightedIndex={highlightedIndex}
              onSelect={handleSelect}
              listboxId={listboxId}
            />
          )}
          {(state.status === 'loading' ||
            state.status === 'empty' ||
            state.status === 'error') && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'var(--color-bg-elevated)',
                border: '1.5px solid var(--color-border)',
                borderTop: 'none',
                borderBottomLeftRadius: 'var(--radius-md)',
                borderBottomRightRadius: 'var(--radius-md)',
                boxShadow: '0 8px 24px var(--color-shadow-lg)',
                zIndex: 10,
              }}
            >
              <SearchStatus
                status={state.status}
                query={state.query}
                errorMessage={
                  state.status === 'error' ? state.message : undefined
                }
                onRetry={state.status === 'error' ? handleRetry : undefined}
              />
            </div>
          )}
        </>
      )}
      {/* Live region for screen reader announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {state.status === 'success' &&
          `${results.length} location${results.length === 1 ? '' : 's'} found`}
        {state.status === 'empty' && `No locations found for ${state.query}`}
        {state.status === 'loading' && 'Searching...'}
      </div>
    </div>
  );
}

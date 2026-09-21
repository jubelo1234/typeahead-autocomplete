'use client';

import { useState, useEffect, useCallback } from 'react';
import { LocationSearch } from '@/components/location-search/location-search';
import type { Location } from '@/types/location';
import styles from './page.module.css';

type Theme = 'light' | 'dark';

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem('theme') as Theme | null;
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export default function Home() {
  const [theme, setTheme] = useState<Theme>('light');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(getInitialTheme());
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const handleSelect = useCallback((location: Location) => {
    setSelectedLocation(location);
  }, []);

  const handleClear = useCallback(() => {
    setSelectedLocation(null);
  }, []);

  return (
    <main className={styles.page}>
      <button
        type="button"
        className={styles['theme-toggle']}
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {mounted && (
          theme === 'light' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2" /><path d="M12 20v2" />
              <path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" />
              <path d="M2 12h2" /><path d="M20 12h2" />
              <path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
            </svg>
          )
        )}
      </button>

      {/* Decorative Background Elements */}
      <div className={styles.background}>
        <div className={styles.blob1} />
        <div className={styles.blob2} />
        <div className={styles['grid-pattern']} />
        
        {/* Abstract Map Pin SVG */}
        <svg 
          className={`${styles['svg-decoration']} ${styles['decor-pin']}`}
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="1" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>

        {/* Abstract Globe/Grid SVG */}
        <svg 
          className={`${styles['svg-decoration']} ${styles['decor-globe']}`}
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="0.5"
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          <path d="M2 12h20" />
        </svg>
        {/* Abstract Compass SVG */}
        <svg
          className={`${styles['svg-decoration']} ${styles['decor-compass']}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>

        {/* Abstract Dotted Path SVG */}
        <svg
          className={`${styles['svg-decoration']} ${styles['decor-path']}`}
          viewBox="0 0 100 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="4 4"
          strokeLinecap="round"
        >
          <path d="M 10,90 Q 30,30 90,10" />
          <circle cx="10" cy="90" r="4" fill="currentColor" stroke="none" />
          <circle cx="90" cy="10" r="4" fill="currentColor" stroke="none" />
        </svg>

        {/* Abstract Target/Radar SVG */}
        <svg
          className={`${styles['svg-decoration']} ${styles['decor-target']}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
          <line x1="12" y1="2" x2="12" y2="22" />
          <line x1="2" y1="12" x2="22" y2="12" />
        </svg>
      </div>

      <header className={styles.header}>
        <h1 className={styles.title}>Location Search</h1>
        <p className={styles.subtitle}>
          Find cities and locations worldwide. Start typing to see suggestions.
        </p>
      </header>

      <div className={styles['search-wrapper']}>
        <LocationSearch onSelect={handleSelect} onClear={handleClear} />
      </div>

      {selectedLocation && (
        <div className={styles['selected-location']}>
          <div className={styles['selected-label']}>Selected Location</div>
          <div className={styles['selected-name']}>{selectedLocation.city}</div>
          <div className={styles['selected-meta']}>
            {selectedLocation.region}, {selectedLocation.country}
            {' · '}
            {selectedLocation.latitude.toFixed(4)}°, {selectedLocation.longitude.toFixed(4)}°
          </div>
        </div>
      )}
    </main>
  );
}

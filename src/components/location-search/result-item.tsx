import type { Location } from '@/types/location';
import styles from './result-item.module.css';

interface ResultItemProps {
  location: Location;
  isHighlighted: boolean;
  onSelect: (location: Location) => void;
  id: string;
}

function formatPopulation(population: number): string {
  if (population >= 1_000_000) {
    return `${(population / 1_000_000).toFixed(1)}M`;
  }
  if (population >= 1_000) {
    return `${(population / 1_000).toFixed(0)}K`;
  }
  return String(population);
}

export function ResultItem({ location, isHighlighted, onSelect, id }: ResultItemProps) {
  return (
    <li
      id={id}
      role="option"
      aria-selected={isHighlighted}
      className={`${styles.item} ${isHighlighted ? styles.highlighted : ''}`}
      onMouseDown={(e) => {
        // Prevent blur on the input so selection works
        e.preventDefault();
        onSelect(location);
      }}
    >
      <svg
        className={styles['pin-icon']}
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
      <div className={styles['item-content']}>
        <div className={styles['city-name']}>{location.city}</div>
        <div className={styles['location-detail']}>
          {location.region}, {location.country}
        </div>
      </div>
      {location.population > 0 && (
        <span className={styles.population}>
          Pop. {formatPopulation(location.population)}
        </span>
      )}
    </li>
  );
}

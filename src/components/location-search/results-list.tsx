import type { Location } from '@/types/location';
import { ResultItem } from './result-item';
import styles from './results-list.module.css';

interface ResultsListProps {
  results: Location[];
  highlightedIndex: number;
  onSelect: (location: Location) => void;
  listboxId: string;
}

export function ResultsList({ results, highlightedIndex, onSelect, listboxId }: ResultsListProps) {
  return (
    <ul
      id={listboxId}
      role="listbox"
      aria-label="Location suggestions"
      className={styles.list}
    >
      {results.map((location, index) => (
        <ResultItem
          key={location.id}
          id={`${listboxId}-option-${index}`}
          location={location}
          isHighlighted={index === highlightedIndex}
          onSelect={onSelect}
        />
      ))}
    </ul>
  );
}

import type { SearchStatus } from '@/types/location';

interface SearchStatusProps {
  status: SearchStatus;
  query: string;
  errorMessage?: string;
  onRetry?: () => void;
}

export function SearchStatus({ status, query, errorMessage, onRetry }: SearchStatusProps) {
  if (status === 'loading') {
    return (
      <div role="status" style={wrapperStyle}>
        <LoadingSpinner />
        <span style={textStyle}>Searching for &ldquo;{query}&rdquo;&hellip;</span>
      </div>
    );
  }

  if (status === 'empty') {
    return (
      <div role="status" style={wrapperStyle}>
        <span style={{ fontSize: '1.25rem' }} aria-hidden="true">🔍</span>
        <span style={textStyle}>No locations found for &ldquo;{query}&rdquo;</span>
        <span style={hintStyle}>Try a different spelling or city name</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div role="alert" style={wrapperStyle}>
        <span style={{ fontSize: '1.25rem' }} aria-hidden="true">⚠️</span>
        <span style={{ ...textStyle, color: 'var(--color-error)' }}>
          {errorMessage || 'Something went wrong'}
        </span>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            style={retryButtonStyle}
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  return null;
}

function LoadingSpinner() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      style={{ animation: 'spin 2s linear infinite', color: 'var(--color-accent)' }}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      <path d="M2 12h20" />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </svg>
  );
}

const wrapperStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 'var(--space-sm)',
  padding: 'var(--space-xl) var(--space-lg)',
};

const textStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  color: 'var(--color-text-secondary)',
  textAlign: 'center',
};

const hintStyle: React.CSSProperties = {
  fontSize: '0.8125rem',
  color: 'var(--color-text-tertiary)',
};

const retryButtonStyle: React.CSSProperties = {
  marginTop: 'var(--space-xs)',
  padding: 'var(--space-sm) var(--space-lg)',
  fontSize: '0.8125rem',
  fontWeight: 500,
  color: 'var(--color-accent)',
  background: 'var(--color-accent-light)',
  border: '1px solid var(--color-accent)',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
  fontFamily: 'inherit',
};

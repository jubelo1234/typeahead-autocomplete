import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocationSearch } from '@/components/location-search/location-search';

// Mock the API module
vi.mock('@/lib/api', () => ({
  searchLocations: vi.fn(),
  MIN_QUERY_LENGTH: 2,
}));

import { searchLocations } from '@/lib/api';

const mockSearchLocations = vi.mocked(searchLocations);

const MOCK_RESULTS = [
  {
    id: '1',
    city: 'Lagos',
    region: 'Lagos',
    country: 'Nigeria',
    countryCode: 'NG',
    population: 15388000,
    latitude: 6.455,
    longitude: 3.3841,
  },
  {
    id: '2',
    city: 'Lahore',
    region: 'Punjab',
    country: 'Pakistan',
    countryCode: 'PK',
    population: 13000000,
    latitude: 31.5497,
    longitude: 74.3436,
  },
  {
    id: '3',
    city: 'Lima',
    region: 'Lima',
    country: 'Peru',
    countryCode: 'PE',
    population: 10719000,
    latitude: -12.0464,
    longitude: -77.0428,
  },
];

describe('LocationSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockSearchLocations.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('renders the search input with correct placeholder', () => {
      render(<LocationSearch />);
      expect(
        screen.getByRole('combobox', { name: /search for a city/i })
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/search cities/i)
      ).toBeInTheDocument();
    });

    it('has correct initial ARIA state', () => {
      render(<LocationSearch />);
      const input = screen.getByRole('combobox');
      expect(input).toHaveAttribute('aria-expanded', 'false');
      expect(input).toHaveAttribute('aria-autocomplete', 'list');
    });
  });

  describe('Debouncing', () => {
    it('does not call the API immediately on keystroke', async () => {
      const user = userEvent.setup({ delay: null });
      mockSearchLocations.mockResolvedValue(MOCK_RESULTS);

      render(<LocationSearch />);
      const input = screen.getByRole('combobox');

      await user.type(input, 'La');

      // Before debounce timer fires
      expect(mockSearchLocations).not.toHaveBeenCalled();
    });

    it('calls the API after debounce delay', async () => {
      const user = userEvent.setup({ delay: null });
      mockSearchLocations.mockResolvedValue(MOCK_RESULTS);

      render(<LocationSearch />);
      const input = screen.getByRole('combobox');

      await user.type(input, 'La');

      // Advance past debounce delay (300ms)
      await vi.advanceTimersByTimeAsync(350);

      await waitFor(() => {
        expect(mockSearchLocations).toHaveBeenCalledTimes(1);
        expect(mockSearchLocations).toHaveBeenCalledWith('La', expect.anything());
      });
    });

    it('does not call API for queries shorter than minimum length', async () => {
      const user = userEvent.setup({ delay: null });

      render(<LocationSearch />);
      const input = screen.getByRole('combobox');

      await user.type(input, 'L');
      await vi.advanceTimersByTimeAsync(350);

      expect(mockSearchLocations).not.toHaveBeenCalled();
    });
  });

  describe('Successful Search', () => {
    it('displays results after successful search', async () => {
      const user = userEvent.setup({ delay: null });
      mockSearchLocations.mockResolvedValue(MOCK_RESULTS);

      render(<LocationSearch />);
      const input = screen.getByRole('combobox');

      await user.type(input, 'La');
      await vi.advanceTimersByTimeAsync(350);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(3);
      expect(screen.getByText('Lagos')).toBeInTheDocument();
      expect(screen.getByText('Lahore')).toBeInTheDocument();
      expect(screen.getByText('Lima')).toBeInTheDocument();
    });

    it('shows location metadata in results', async () => {
      const user = userEvent.setup({ delay: null });
      mockSearchLocations.mockResolvedValue(MOCK_RESULTS);

      render(<LocationSearch />);
      await user.type(screen.getByRole('combobox'), 'La');
      await vi.advanceTimersByTimeAsync(350);

      await waitFor(() => {
        expect(screen.getByText(/Lagos, Nigeria/)).toBeInTheDocument();
      });
    });

    it('sets aria-expanded to true when results are shown', async () => {
      const user = userEvent.setup({ delay: null });
      mockSearchLocations.mockResolvedValue(MOCK_RESULTS);

      render(<LocationSearch />);
      const input = screen.getByRole('combobox');

      await user.type(input, 'La');
      await vi.advanceTimersByTimeAsync(350);

      await waitFor(() => {
        expect(input).toHaveAttribute('aria-expanded', 'true');
      });
    });
  });

  describe('Empty Results', () => {
    it('shows empty state when no results are returned', async () => {
      const user = userEvent.setup({ delay: null });
      mockSearchLocations.mockResolvedValue([]);

      render(<LocationSearch />);
      await user.type(screen.getByRole('combobox'), 'xyzabc');
      await vi.advanceTimersByTimeAsync(350);

      await waitFor(() => {
        const elements = screen.getAllByText(/no locations found/i);
        expect(elements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Handling', () => {
    it('shows error state when API call fails', async () => {
      const user = userEvent.setup({ delay: null });
      mockSearchLocations.mockRejectedValue(new Error('Network error'));

      render(<LocationSearch />);
      await user.type(screen.getByRole('combobox'), 'La');
      await vi.advanceTimersByTimeAsync(350);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('shows retry button on error', async () => {
      const user = userEvent.setup({ delay: null });
      mockSearchLocations.mockRejectedValue(new Error('Server error'));

      render(<LocationSearch />);
      await user.type(screen.getByRole('combobox'), 'La');
      await vi.advanceTimersByTimeAsync(350);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /try again/i })
        ).toBeInTheDocument();
      });
    });

    it('does not show error for aborted requests', async () => {
      const user = userEvent.setup({ delay: null });
      const abortError = new DOMException('Aborted', 'AbortError');
      mockSearchLocations.mockRejectedValue(abortError);

      render(<LocationSearch />);
      await user.type(screen.getByRole('combobox'), 'La');
      await vi.advanceTimersByTimeAsync(350);

      // Wait a tick and verify no error appears
      await vi.advanceTimersByTimeAsync(50);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('highlights first item on ArrowDown', async () => {
      const user = userEvent.setup({ delay: null });
      mockSearchLocations.mockResolvedValue(MOCK_RESULTS);

      render(<LocationSearch />);
      const input = screen.getByRole('combobox');

      await user.type(input, 'La');
      await vi.advanceTimersByTimeAsync(350);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      await user.keyboard('{ArrowDown}');

      const options = screen.getAllByRole('option');
      expect(options[0]).toHaveAttribute('aria-selected', 'true');
    });

    it('navigates through results with arrow keys', async () => {
      const user = userEvent.setup({ delay: null });
      mockSearchLocations.mockResolvedValue(MOCK_RESULTS);

      render(<LocationSearch />);
      const input = screen.getByRole('combobox');

      await user.type(input, 'La');
      await vi.advanceTimersByTimeAsync(350);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowDown}');

      const options = screen.getAllByRole('option');
      expect(options[0]).toHaveAttribute('aria-selected', 'false');
      expect(options[1]).toHaveAttribute('aria-selected', 'true');
    });

    it('wraps to first item when pressing ArrowDown at the end', async () => {
      const user = userEvent.setup({ delay: null });
      mockSearchLocations.mockResolvedValue(MOCK_RESULTS);

      render(<LocationSearch />);
      const input = screen.getByRole('combobox');

      await user.type(input, 'La');
      await vi.advanceTimersByTimeAsync(350);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // Navigate past the last item (3 items, press down 4 times)
      await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}');

      const options = screen.getAllByRole('option');
      expect(options[0]).toHaveAttribute('aria-selected', 'true');
    });

    it('wraps to last item when pressing ArrowUp from the top', async () => {
      const user = userEvent.setup({ delay: null });
      mockSearchLocations.mockResolvedValue(MOCK_RESULTS);

      render(<LocationSearch />);
      const input = screen.getByRole('combobox');

      await user.type(input, 'La');
      await vi.advanceTimersByTimeAsync(350);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // ArrowDown first to set index to 0, then ArrowUp wraps to last
      await user.keyboard('{ArrowDown}{ArrowUp}');

      const options = screen.getAllByRole('option');
      expect(options[options.length - 1]).toHaveAttribute('aria-selected', 'true');
    });

    it('selects highlighted item on Enter', async () => {
      const user = userEvent.setup({ delay: null });
      const onSelect = vi.fn();
      mockSearchLocations.mockResolvedValue(MOCK_RESULTS);

      render(<LocationSearch onSelect={onSelect} />);
      const input = screen.getByRole('combobox');

      await user.type(input, 'La');
      await vi.advanceTimersByTimeAsync(350);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      await user.keyboard('{ArrowDown}{Enter}');

      expect(onSelect).toHaveBeenCalledWith(MOCK_RESULTS[0]);
      expect(input).toHaveValue('Lagos');
    });

    it('closes dropdown on Escape', async () => {
      const user = userEvent.setup({ delay: null });
      mockSearchLocations.mockResolvedValue(MOCK_RESULTS);

      render(<LocationSearch />);
      const input = screen.getByRole('combobox');

      await user.type(input, 'La');
      await vi.advanceTimersByTimeAsync(350);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      await user.keyboard('{Escape}');

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      expect(input).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('Selection', () => {
    it('populates input with city name on selection', async () => {
      const user = userEvent.setup({ delay: null });
      mockSearchLocations.mockResolvedValue(MOCK_RESULTS);

      render(<LocationSearch />);
      const input = screen.getByRole('combobox');

      await user.type(input, 'La');
      await vi.advanceTimersByTimeAsync(350);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');

      expect(input).toHaveValue('Lahore');
    });

    it('calls onSelect callback with location data', async () => {
      const user = userEvent.setup({ delay: null });
      const onSelect = vi.fn();
      mockSearchLocations.mockResolvedValue(MOCK_RESULTS);

      render(<LocationSearch onSelect={onSelect} />);

      await user.type(screen.getByRole('combobox'), 'La');
      await vi.advanceTimersByTimeAsync(350);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      await user.keyboard('{ArrowDown}{Enter}');

      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          city: 'Lagos',
          country: 'Nigeria',
        })
      );
    });

    it('closes dropdown after selection', async () => {
      const user = userEvent.setup({ delay: null });
      mockSearchLocations.mockResolvedValue(MOCK_RESULTS);

      render(<LocationSearch />);

      await user.type(screen.getByRole('combobox'), 'La');
      await vi.advanceTimersByTimeAsync(350);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      await user.keyboard('{ArrowDown}{Enter}');

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  describe('Stale Response Handling', () => {
    it('ignores a stale response that resolves after a newer request', async () => {
      const user = userEvent.setup({ delay: null });

      const staleResults = [
        {
          id: '100',
          city: 'Lancaster',
          region: 'Pennsylvania',
          country: 'United States',
          countryCode: 'US',
          population: 60000,
          latitude: 40.0379,
          longitude: -76.3055,
        },
      ];

      const freshResults = [
        {
          id: '1',
          city: 'Lagos',
          region: 'Lagos',
          country: 'Nigeria',
          countryCode: 'NG',
          population: 15388000,
          latitude: 6.455,
          longitude: 3.3841,
        },
      ];

      let staleResolve: (value: typeof staleResults) => void;
      let freshResolve: (value: typeof freshResults) => void;

      // First call (for "La") - will resolve LATER (stale)
      mockSearchLocations.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            staleResolve = resolve;
          })
      );

      render(<LocationSearch />);
      const input = screen.getByRole('combobox');

      // Type "La" and trigger debounce
      await user.type(input, 'La');
      await vi.advanceTimersByTimeAsync(350);

      await waitFor(() => expect(mockSearchLocations).toHaveBeenCalledTimes(1));

      // Second call (for "Lagos") - will resolve FIRST (fresh)
      mockSearchLocations.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            freshResolve = resolve;
          })
      );

      // Clear and type "Lagos"
      await user.clear(input);
      await user.type(input, 'Lagos');
      await vi.advanceTimersByTimeAsync(350);

      await waitFor(() => expect(mockSearchLocations).toHaveBeenCalledTimes(2));

      // Fresh response arrives first
      freshResolve!(freshResults);
      await vi.advanceTimersByTimeAsync(0);

      await waitFor(() => {
        expect(screen.getByText('Lagos')).toBeInTheDocument();
      });

      // Stale response arrives later — should be ignored
      staleResolve!(staleResults);
      await vi.advanceTimersByTimeAsync(0);

      // "Lancaster" from the stale response should NOT appear
      expect(screen.queryByText('Lancaster')).not.toBeInTheDocument();
      // "Lagos" from the fresh response should still be shown
      expect(screen.getByText('Lagos')).toBeInTheDocument();
    });
  });

  describe('Clear Behavior', () => {
    it('clears input and results when clear button is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      mockSearchLocations.mockResolvedValue(MOCK_RESULTS);

      render(<LocationSearch />);
      const input = screen.getByRole('combobox');

      await user.type(input, 'La');
      await vi.advanceTimersByTimeAsync(350);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      const clearButton = screen.getByRole('button', {
        name: /clear search/i,
      });
      await user.click(clearButton);

      expect(input).toHaveValue('');
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading indicator while searching', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      // Never-resolving promise to keep loading state active
      mockSearchLocations.mockReturnValue(new Promise(() => {}));

      render(<LocationSearch />);
      await user.type(screen.getByRole('combobox'), 'La');
      await vi.advanceTimersByTimeAsync(350);

      await waitFor(() => {
        expect(screen.getByText(/searching for/i)).toBeInTheDocument();
      });
    });
  });
});
